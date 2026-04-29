explanation: Create a top-level README that consolidates project purpose, quickstart, testing and docs navigation
# QapiRag-Jira-Mock

...existing code...
# QapiRag-Jira-Mock

Projet de mock Jira / Atlassian destiné à fournir une API compatible MCP pour les tests d'intégration. Le mock est composé de :
- WireMock (mappings + fixtures) qui simule l'API Jira Cloud (REST v3)
- Un petit service `mcp` (Node/Express) qui expose des endpoints MCP (get_issue, search_issues, get_changelog) et redirige vers WireMock

Objectifs
- Fournir un environnement local/CI pour tester des clients MCP (ex : QapiRagPOC)
- Permettre de simuler réponses success, erreurs, cas non authentifiés et recherches
- Être scriptable et intégrable en CI

Quickstart (local)
1. Depuis la racine du dépôt :

```bash
cd /opt/QapiRag-Jira-Mock    # ou le chemin du dépôt cloné
# (re)build mcp si tu as modifié le Dockerfile
docker compose build --no-cache mcp
# démarrer WireMock + MCP
docker compose up -d --no-deps --force-recreate wiremock mcp
```

2. Vérifier les health endpoints :

```bash
curl -sS http://127.0.0.1:8092/health   # WireMock
curl -sS http://127.0.0.1:3000/health   # MCP
```

3. Appel d'exemple (MCP -> WireMock) — le header Authorization est requis pour les fixtures :

```bash
curl -sS -H "Content-Type: application/json" -H "Authorization: Bearer dummy" \
  -d '{"issueKey":"QAPI-123"}' \
  http://127.0.0.1:3000/mcp/get_issue | jq . || true
```

Structure du dépôt
- `mcp/` : code du routeur MCP (Node.js)
- `docker/`, `__files/`, `mappings/` : fixtures et configuration WireMock
- `scripts/` : scripts d'aide (health checks, tests)
- `docs/` : documentation opérationnelle et CI

Documentation
Consulte le dossier `docs/` pour l'architecture, la CI et les guides d'utilisation :
- `docs/ARCHITECTURE.md` — décisions techniques et flux
- `docs/ci.md` — exemple GitHub Actions pour exécuter les tests d'intégration

Contribuer
- Respecte la branche `develop` pour développement et PR vers `develop` → merge sur `develop` (processus interne)
- Ajoute des fixtures JSON dans `__files/` et mappings correspondants dans `mappings/`
- Pour des builds reproductibles, ajoute un `package-lock.json` dans `mcp/` et nous passerons à `npm ci` dans le Dockerfile

Contact / Sécurité
- Évite de partager des tokens en clair. Si un token a été exposé, révoque‑le immédiatement sur GitHub.


