# Quickstart — démarrage et validations

1) Lancer le mock (depuis le dossier du projet `QapiRag-Jira-Mock`) :

```bash
cd /path/to/QapiRag-Jira-Mock
docker compose up -d
```

2) Vérifier que WireMock est prêt :

```bash
curl -i http://127.0.0.1:8092/health
curl -sS http://127.0.0.1:8092/__admin/mappings | jq '.mappings | length'
```

3) Tester quelques stubs :

```bash
# Ticket trouvé (avec header Authorization requis par les mappings)
curl -i -H "Authorization: Bearer dummy" http://127.0.0.1:8092/rest/api/3/issue/QAPI-123

# Recherche
curl -i -H "Authorization: Bearer dummy" "http://127.0.0.1:8092/rest/api/3/search?jql=project=QAPI"

# Changelog
curl -i -H "Authorization: Bearer dummy" "http://127.0.0.1:8092/rest/api/3/issue/QAPI-123?expand=changelog"
```

4) Exécuter le script d'auto‑vérification :

```bash
chmod +x scripts/health-check.sh
bash scripts/health-check.sh
```

Si tous les checks sont OK, le mock est prêt pour exécuter des tests E2E ou pour être ciblé par le MCP.
