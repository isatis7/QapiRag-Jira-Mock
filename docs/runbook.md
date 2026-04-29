# Runbook opérationnel

Ce runbook décrit les procédures de démarrage, debug et nettoyage pour le projet mock (WireMock + MCP).

Pré-requis
- Docker et Docker Compose installés sur la machine
- Accès au dépôt (fichier `docker-compose.yml` à la racine)

Démarrage rapide
1. Depuis la racine du dépôt :

```bash
cd /opt/QapiRag-Jira-Mock
# si Dockerfile mcp a changé
docker compose build --no-cache mcp
# démarrer les services
docker compose up -d --no-deps --force-recreate wiremock mcp
```

Vérifications

```bash
# health endpoints
curl -sS http://127.0.0.1:8092/health
curl -sS http://127.0.0.1:3000/health

# logs
docker logs --tail 200 qapirag-jira-mock
docker logs --tail 200 qapirag-mcp-mock
```

Test API via MCP

```bash
curl -sS -H "Content-Type: application/json" -H "Authorization: Bearer dummy" \
  -d '{"issueKey":"QAPI-123"}' \
  http://127.0.0.1:3000/mcp/get_issue | jq .
```

Débogage pas à pas
- Si le container `mcp` plante avec "Cannot find module 'express'": rebuild sans cache et vérifier que `npm install` s'exécute correctement dans le Dockerfile.
- Inspecter l'image :

```bash
docker run --rm -it isatis7/qapirag-mcp-mock:dev sh -c 'ls -la /app; ls -la /app/node_modules || echo "no node_modules"'
```

- Si WireMock renvoie des erreurs 401, vérifier que l'en-tête `Authorization` est transmis par le client et forwardé par l'`mcp`.

Nettoyage

```bash
docker compose down --remove-orphans
# optionnel: supprimer images non utilisées
docker system prune -f
```

Points d'amélioration
- Ajouter `package-lock.json` dans `mcp/` et utiliser `npm ci --only=production` pour des builds reproductibles.
- Ajouter step CI pour construire l'image MCP et exécuter `scripts/test-mcp.sh`.

