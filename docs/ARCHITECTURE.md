# Architecture

Ce document décrit l'architecture du projet et son organisation.

## Services

Le projet se compose de plusieurs services communiquant entre eux :

- **WireMock** : un simulateur d'API HTTP.
- **MCP (Mock Control Plane)** : un service simulant le plan de contrôle.

## Conteneurs

Les services sont exécutés dans des conteneurs Docker :

- `wiremock` : conteneur pour le service WireMock.
- `qapirag-mcp-mock` : conteneur pour le service MCP.

## Réseau

Les conteneurs communiquent entre eux via un réseau Docker interne. Les ports suivants sont exposés :

- `8080` : port WireMock.
- `8081` : port MCP.

## Observabilité

- Endpoints `/health` exposés pour WireMock et MCP.
- Logs Docker des deux containers (wiremock, qapirag-mcp-mock) pour diagnostic.

## Bonnes pratiques proposées

- Versionner `mappings/` et `__files/` pour traçabilité et CI.
- Ajouter un workflow GitHub Actions qui :
  - valide la syntaxe JSON des mappings,
  - construit l'image MCP,
  - démarre les containers et exécute `scripts/test-mcp.sh`.

## Documentation et runbook

La documentation du projet est centralisée dans `docs/` :

- `docs/ARCHITECTURE.md` (ce fichier)
- `docs/ci.md` — workflow d'intégration exemple
- `docs/runbook.md` — procédures opérationnelles (démarrage, debug, nettoyage)
- `docs/fixtures.md` — guide sur la création de fixtures et mappings WireMock

Assure-toi que le README racine pointe vers `docs/` pour éviter les doublons.
