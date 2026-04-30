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
                .uri(URI.create(baseUrl + "/rest/api/3/issue/QAPI-123"))
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
                .uri(URI.create(baseUrl + "/rest/api/3/issue/QAPI-123"))
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isIn(401, 403);
    }

    @Test
    void testGetIssue_NotFound() throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/3/issue/INEXISTANT-999"))
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
        String q = "project=QAPI";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/3/search?jql=" + java.net.URLEncoder.encode(q, java.nio.charset.StandardCharsets.UTF_8)))
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isEqualTo(200);
        JsonNode json = MAPPER.readTree(res.body());
        Assertions.assertThat(json.get("total").asInt()).isGreaterThan(0);
        Assertions.assertThat(json.get("issues")).isNotNull();
    }

    @Test
    void testSearch_Empty() throws IOException, InterruptedException {
        String q = "project=QAPI AND status=Done";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/3/search?jql=" + java.net.URLEncoder.encode(q, java.nio.charset.StandardCharsets.UTF_8)))
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
        Assertions.assertThat(res.statusCode()).isEqualTo(200);
        JsonNode json = MAPPER.readTree(res.body());
        Assertions.assertThat(json.get("total").asInt()).isEqualTo(0);
    }

    @Test
    void testGetIssue_Changelog() throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/rest/api/3/issue/QAPI-123?expand=changelog"))
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
