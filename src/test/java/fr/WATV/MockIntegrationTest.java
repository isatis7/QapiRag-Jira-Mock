package fr.WATV;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * #26 : ce test intégration validait les stubs WireMock contre EUX-MÊMES (mêmes
 * chemins/formes que les mappings), pas contre l'usage RÉEL du client consommateur
 * (fr.WATV.client.JiraClient, repo QapiRagPOC) -- il passait donc au vert alors que
 * les stubs étaient désynchronisés (issue/changelog en /rest/api/3/... au lieu de
 * /rest/api/2/..., search en /rest/api/3/search au lieu de /rest/api/3/search/jql,
 * Jira Cloud ayant migré/supprimé les anciens endpoints). Réaligné sur les chemins
 * et la forme de réponse RÉELLEMENT utilisés par JiraClient.searchTickets/getTicket/
 * getChangeLog (recherche : plus de champ `total`, pagination via `isLast`).
 */
public class MockIntegrationTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient CLIENT = HttpClient.newHttpClient();
    private static String baseUrl;
    private static String token;

    @BeforeAll
    static void init() {
        baseUrl = System.getenv().getOrDefault("JIRA_API_BASE_URL", "http://localhost:8092");
        token = System.getenv().getOrDefault("JIRA_API_TOKEN", "dummy-token");

        // wait for health up to 30s
        boolean ok = false;
        for (int i = 0; i < 30; i++) {
            try {
                HttpRequest r = HttpRequest.newBuilder()
                        .uri(URI.create(baseUrl + "/health"))
                        .timeout(Duration.ofSeconds(2))
                        .GET()
                        .build();
                HttpResponse<String> resp = CLIENT.send(r, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200 && resp.body().contains("UP")) {
                    ok = true;
                    break;
                }
            } catch (Exception ignored) {
            }
            try { Thread.sleep(1000L); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
        if (!ok) {
            throw new IllegalStateException("WireMock mock not ready at " + baseUrl);
        }
    }

    @Test
    void testGetIssue_Success() throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/2/issue/QAPI-123"))
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();

        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isEqualTo(200);
        JsonNode json = MAPPER.readTree(res.body());
        Assertions.assertThat(json.get("key").asText()).isEqualTo("QAPI-123");
        Assertions.assertThat(json.get("id")).isNotNull();
        Assertions.assertThat(json.at("/fields/summary").asText()).isNotEmpty();
        Assertions.assertThat(json.at("/fields/status/name").asText()).isNotEmpty();
    }

    @Test
    void testGetIssue_Unauthorized() throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/2/issue/QAPI-123"))
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isIn(401, 403);
    }

    @Test
    void testGetIssue_NotFound() throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/2/issue/INEXISTANT-999"))
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isEqualTo(404);
        JsonNode json = MAPPER.readTree(res.body());
        Assertions.assertThat(json.get("errorMessages")).isNotNull();
    }

    @Test
    void testSearch_WithResults() throws IOException, InterruptedException {
        // #26 : /rest/api/3/search/jql (Jira Cloud enhanced JQL search) -- le
        // vieil endpoint /rest/api/3/search est supprimé (410 Gone). `fields` est
        // requis explicitement, cf. JiraClient.searchTickets (repo QapiRagPOC).
        String q = "project=QAPI";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/3/search/jql?jql="
                        + java.net.URLEncoder.encode(q, java.nio.charset.StandardCharsets.UTF_8)
                        + "&fields=summary,status,priority,assignee,updated&maxResults=50"))
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isEqualTo(200);
        JsonNode json = MAPPER.readTree(res.body());
        // #26 : le nouvel endpoint ne renvoie plus `total` (cf. JiraSearchResults,
        // repo QapiRagPOC) -- la taille réelle du tableau `issues` est le seul
        // signal fiable désormais.
        Assertions.assertThat(json.get("issues")).isNotNull();
        Assertions.assertThat(json.get("issues").size()).isGreaterThan(0);
    }

    @Test
    void testSearch_Empty() throws IOException, InterruptedException {
        String q = "project=QAPI AND status=Done";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/3/search/jql?jql="
                        + java.net.URLEncoder.encode(q, java.nio.charset.StandardCharsets.UTF_8)
                        + "&fields=summary,status,priority,assignee,updated&maxResults=50"))
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isEqualTo(200);
        JsonNode json = MAPPER.readTree(res.body());
        Assertions.assertThat(json.get("issues").size()).isEqualTo(0);
    }

    @Test
    void testGetIssue_Changelog() throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/2/issue/QAPI-123?expand=changelog"))
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isEqualTo(200);
        JsonNode json = MAPPER.readTree(res.body());
        Assertions.assertThat(json.get("changelog")).isNotNull();
        Assertions.assertThat(json.at("/changelog/histories").isArray()).isTrue();
    }
}
