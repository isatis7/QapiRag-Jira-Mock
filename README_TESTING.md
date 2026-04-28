# README_TESTING — exécution des tests du mock

Prérequis : Docker et `docker compose` ; Maven pour exécuter les tests Java.

1) Démarrer le mock WireMock (si nécessaire) :

```bash
cd /path/to/QapiRag-Jira-Mock
docker compose up -d
```

2) Vérifier `/health` :

```bash
curl -i http://127.0.0.1:8092/health
```

3) Lancer les tests Java unit/integration du projet mock :

```bash
mvn -B test
```

Variables d'environnement utiles :
- `JIRA_API_BASE_URL` : URL du mock (défaut `http://localhost:8092`)
- `JIRA_API_TOKEN` : token utilisé par les tests (défaut `dummy-token`)

Exemple :

```bash
export JIRA_API_BASE_URL='http://localhost:8092'
export JIRA_API_TOKEN='dummy-token'
mvn test
```

Si les tests échouent, vérifiez les logs WireMock :

```bash
docker compose logs wiremock --tail 200
```

