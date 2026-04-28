# QapiRag-Jira-Mock

Mock Jira Cloud v3 basé sur WireMock standalone — destiné aux tests E2E du projet QapiRag.

Objectif : fournir un serveur WireMock Dockerisé capable d'imiter les endpoints Jira Cloud v3 utilisés par le client Spring Boot (GET issue, search, changelog) avec scénarios succès et erreurs.

----

## Contenu du dépôt

- `mappings/` : fichiers JSON WireMock (stubs).
- `__files/` : fixtures JSON (corps de réponse référencés par `bodyFileName`).
- `docker-compose.yml` : orchestration Docker (expose port 8092).
- `scripts/health-check.sh` : script d'auto-vérification (utilise `curl` + `jq`).

----

## Prérequis

- Docker et Docker Compose (v2) installés.
- (Optionnel) `jq` pour formater/valider JSON lors des vérifications.

----

## Démarrage (développement)

Depuis la racine du projet :

```bash
cd /path/to/QapiRag-Jira-Mock
docker compose up -d
```

Vérifier le container et les logs :

```bash
docker ps --filter "name=qapirag-jira-mock"
docker compose logs -f wiremock
```

L'API mock est disponible sur : http://localhost:8092

Note : Compose v2 ignore la clé `version` dans le fichier compose — c'est sans impact fonctionnel.

----

## Endpoints simulés

Les mappings fournis (exemples) :

- GET /rest/api/3/issue/QAPI-123  -> 200 (fixture `ticket-QAPI-123.json`)
- GET /rest/api/3/issue/{key}    -> 404 si ticket inconnu (fixture 404 JSON)
- GET /rest/api/3/issue/{key}?expand=changelog -> 200 (fixture `changelog-QAPI-123.json`)
- GET /rest/api/3/search?jql=project=QAPI -> 200 (fixture `search-results.json`)
- GET /health -> 200 {"status":"UP"} (utilisé pour probes)

Comportement d'authentification :
- Un mapping 401 est défini pour `GET /rest/api/3/issue/*` si l'en-tête `Authorization` est absent — envoyez un header (même fictif) pour atteindre les mappings 200/404.

----

## Tests et vérifications (rapides)

Exemples `curl` :

```bash
# Ticket trouvé (avec header Authorization exigé par les mappings)
curl -i -H "Authorization: Bearer dummy" http://localhost:8092/rest/api/3/issue/QAPI-123

# Recherche (avec Authorization)
curl -i -H "Authorization: Bearer dummy" "http://localhost:8092/rest/api/3/search?jql=project=QAPI"

# Changelog
curl -i -H "Authorization: Bearer dummy" "http://localhost:8092/rest/api/3/issue/QAPI-123?expand=changelog"

# Ticket inconnu (renvoie 404 si Authorization présent)
curl -i -H "Authorization: Bearer dummy" http://localhost:8092/rest/api/3/issue/INEXISTANT-999

# 401 (absence d'Authorization)
curl -i http://localhost:8092/rest/api/3/issue/QAPI-123

# Health endpoint
curl -i http://localhost:8092/health

# Lister mappings chargés (admin API)
curl -sS http://127.0.0.1:8092/__admin/mappings | jq '.mappings | length'
```

----

## Script d'auto‑vérification

Un script utile : `scripts/health-check.sh` — il vérifie que :

- l'API admin `/__admin/mappings` répond,
- l'endpoint `/health` retourne 200,
- un exemple métier `/rest/api/3/issue/QAPI-123` répond et contient les champs attendus.

Usage :

```bash
chmod +x scripts/health-check.sh
bash scripts/health-check.sh
```

----

## Détails des mappings et fixtures

- Les mappings utilisent `urlPath`/`urlPathPattern` et `queryParameters` pour matcher précisément les requêtes.
- Pour les réponses volumineuses, nous utilisons `bodyFileName` qui référence les fichiers sous `__files/`.
- Les priorités sont utilisées : `priority: 1` = plus prioritaire (ex : mapping 401), `priority: 10` moins prioritaire.

Champs essentiels dans les fixtures (conformes au client Spring Boot) :
- `key`, `id`, `fields.summary`, `fields.description`, `fields.status.name`, `fields.assignee.displayName`.

----

## Dépannage (FAQ rapide)

- 403 / 404 sur `/` : normal — WireMock ne fournit pas de contenu racine. Utilisez `/__admin` ou vos endpoints.
- Mapping non trouvé (logs montrent "Request was not matched") : vérifiez
  1) que le fichier existe physiquement dans `mappings/` sur l'hôte,
  2) que le montage fonctionne (vérifier `docker exec <container> ls -la /home/wiremock/mappings`),
  3) redémarrer WireMock (`docker compose restart wiremock`) ou poster le mapping via l'API admin (`POST /__admin/mappings`).
- Warning `version` dans docker-compose : sans conséquence mais supprimez la clé si vous voulez éviter le warning.
- 401 inattendu : vérifiez présence et valeur de l'en-tête `Authorization` dans la requête.

----

## Déploiement reproductible (recommandé pour prod)

Option A — Créer une image Docker qui contient les mappings :

Dockerfile minimal suggestion (ajouter à `docker/`):

```dockerfile
FROM wiremock/wiremock:3.3.1
COPY mappings /home/wiremock/mappings
COPY __files /home/wiremock/__files
EXPOSE 8080
ENTRYPOINT ["java","-jar","/wiremock/wiremock-standalone.jar","--verbose"]
```

Build & push :

```bash
docker build -f docker/Dockerfile -t ghcr.io/<owner>/qapirag-jira-mock:1.0.0 .
docker push ghcr.io/<owner>/qapirag-jira-mock:1.0.0
```

Sur Kubernetes, déployez l'image et exposez via Service/Ingress. Utilisez `readinessProbe` pointant sur `/health`.

----

## Intégration CI / qualité

- Ajouter un workflow GitHub Actions pour :
  - valider la syntaxe JSON des mappings et fixtures,
  - lancer un container WireMock dans le job et exécuter `scripts/health-check.sh`.
- Ajouter des tests de contrat (p.ex. JSON Schema) si votre client attend des structures exactes.

----

## Versionnement des mappings

Actuellement le dépôt contient les mappings principaux; la `.gitignore` originale contenait `mappings/` et `__files/`. Pour la reproductibilité et CI, il est recommandé de versionner ces dossiers (ou d'empaqueter les mappings dans l'image Docker). Si vous souhaitez que je retire `mappings/` et `__files/` de `.gitignore`, dites‑le et je le fais.

----

## Bonnes pratiques

- Versionnez mappings + fixtures pour traçabilité.
- Pour tests E2E, envoyez un header `Authorization` (même fictif) si vos mappings l'exigent.
- Utilisez `priority` pour résoudre conflits entre mappings (401 v.s. 200).
- Pour injection d'erreurs/latence, utilisez les capacités de WireMock (fault, fixedDelay, etc.).

----

Si vous voulez, je peux :
- ajouter un `Dockerfile` et un workflow GitHub Actions pour builder/pusher l'image automatiquement,
- retirer `mappings/` et `__files/` de `.gitignore` et commit/push,
- créer un `systemd` unit + timer qui exécute `scripts/health-check.sh` régulièrement sur votre VM.

Choisissez la suite et je l'implémente.

