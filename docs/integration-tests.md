# Integration tests — instructions et prompt pour Copilot

But : fournir les informations et un prompt complet pour générer des tests d'intégration du MCP (Spring Boot) qui ciblent le mock WireMock.

Variables d'environnement à fournir au MCP lors des tests :
- `JIRA_API_BASE_URL` (ex: `http://localhost:8092` ou `http://qapirag-jira-mock:8080` en compose)
- `JIRA_API_TOKEN` (ex: `dummy-token`)

Checklist tests recommandés :
- testGetIssue_Success
- testGetIssue_Unauthorized
- testGetIssue_NotFound
- testSearch_WithResults
- testSearch_Empty
- testGetIssue_Changelog

Prompt pour GitHub Copilot (copier-coller) :
```
Génère des tests d'integration JUnit 5 pour le projet MCP Spring Boot qui valident l'intégration contre un mock Jira Cloud v3 (WireMock) déployé sur http://localhost:8092.

Contraintes :
- Le mock est un container Docker externe au test : ne pas démarrer WireMock programmatique.
- Les tests doivent utiliser @SpringBootTest(webEnvironment = RANDOM_PORT) et override la propriété jira.base-url et jira.token via @TestPropertySource ou @DynamicPropertySource en lisant les variables d'environnement JIRA_API_BASE_URL et JIRA_API_TOKEN.

Contenu attendu du fichier JiraIntegrationTest.java :
- injection de TestRestTemplate ou WebTestClient
- 6 tests indépendants listés ci-dessus
- assertions sur codes HTTP et présence des champs `key`, `id`, `fields.summary`, `fields.status.name`, `fields.assignee.displayName`.

Génère aussi un fichier README_TESTING.md décrivant comment démarrer le mock et exécuter les tests.
```

Exemple d'override properties (extrait) :
```java
@DynamicPropertySource
static void registerProps(DynamicPropertyRegistry r) {
  String base = System.getenv().getOrDefault("JIRA_API_BASE_URL", "http://localhost:8092");
  String token = System.getenv().getOrDefault("JIRA_API_TOKEN", "dummy-token");
  r.add("jira.base-url", () -> base);
  r.add("jira.token", () -> token);
}
```

CI : s'assurer que WireMock est démarré avant d'exécuter les tests (voir `ci.md` pour le workflow GitHub Actions exemple).

