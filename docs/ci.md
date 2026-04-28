# CI : exemple GitHub Actions

Workflow minimal pour démarrer le mock et exécuter les tests du MCP.

Fichier : `.github/workflows/integration-tests.yml`

Contenu minimal :

```yaml
name: Integration tests (MCP ↔ WireMock)

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          path: qapirag-jira-mock

      - name: Start WireMock (mock repo)
        working-directory: qapirag-jira-mock
        run: |
          docker compose up -d

      - name: Wait for WireMock health
        run: |
          for i in $(seq 1 30); do
            if curl -sS http://localhost:8092/health | grep -q '"status":"UP"'; then
              echo "WireMock ready"; exit 0
            fi
            echo "waiting... ($i)"; sleep 2
          done
          exit 1

      - name: Run MCP tests
        working-directory: ../mcp # adapter
        run: |
          export JIRA_API_BASE_URL='http://localhost:8092'
          export JIRA_API_TOKEN='dummy-token'
          mvn -B -Dskip.unit.tests=false test

      - name: Tear down WireMock
        working-directory: qapirag-jira-mock
        if: always()
        run: docker compose down --remove-orphans
```

Remarques :
- Adapter `working-directory` et chemins selon l'organisation de vos repos (monorepo ou checkout multiple).
- Prévoir credentials/permissions si push d'images vers un registre.

