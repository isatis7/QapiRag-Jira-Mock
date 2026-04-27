# QapiRag-Jira-Mock

Mock Jira Cloud v3 basé sur WireMock standalone pour tests end-to-end du projet QapiRag.

## Structure

- `mappings/` : mappings WireMock (stubs)
- `__files/` : fixtures JSON (bodyFileName)
- `docker-compose.yml` : lance WireMock sur le port 8092

## Prérequis

- Docker installé

## Lancer le mock

```powershell
# depuis la racine du projet
docker-compose up -d

# vérifier les logs
docker-compose logs -f wiremock
```

Le mock écoute sur http://localhost:8092

## Endpoints disponibles

- GET /rest/api/3/issue/QAPI-123 -> 200 (fixture: `ticket-QAPI-123.json`)
- GET /rest/api/3/issue/{key} -> 404 si ticket inconnu
- GET /rest/api/3/issue/{key}?expand=changelog -> 200 (fixture: `changelog-QAPI-123.json`)
- GET /rest/api/3/search?jql=project=QAPI -> 200 (fixture: `search-results.json`)
- Si l'en-tête `Authorization` est absent, les endpoints `GET /rest/api/3/issue/*` retournent 401

## Tests rapides (curl)

```powershell
# Ticket trouvé
curl -i http://localhost:8092/rest/api/3/issue/QAPI-123

# Recherche
curl -i "http://localhost:8092/rest/api/3/search?jql=project=QAPI"

# Changelog
curl -i "http://localhost:8092/rest/api/3/issue/QAPI-123?expand=changelog"

# Ticket pas trouvé
curl -i http://localhost:8092/rest/api/3/issue/INEXISTANT-999

# 401 (absence de Authorization)
curl -i http://localhost:8092/rest/api/3/issue/QAPI-123
```

## Ajouter un nouveau stub

1. Ajouter un fichier mapping JSON dans `mappings/`.
2. Ajouter les fixtures JSON dans `__files/` et référencer via `bodyFileName`.
3. Les mappings sont rechargés automatiquement par WireMock au démarrage ; pour recharger à chaud, redémarrer le service Docker.

## Bonnes pratiques

- Utiliser des `bodyFileName` pour réponses volumineuses.
- Utiliser `priority` pour contrôler l'ordre des mappings (1 = plus prioritaire).
- Rédiger des fixtures réalistes correspondant aux champs attendus par le client (key, id, fields.summary, fields.description, fields.status.name, fields.assignee.displayName).

