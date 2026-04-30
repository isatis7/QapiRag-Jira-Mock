# QA audit — corrections appliquées

Ce document liste les corrections appliquées suite à l'audit qualité effectué sur le dépôt du mock WireMock.

Corrections (branche `fix/qa-audit-improvements`, PR #25)

- Robustesse des mappings JQL (HAUTE)
  - `mappings/search-tickets-empty.json` et `mappings/search-tickets-success.json` utilisent désormais `matches` (regex) au lieu de `equalTo` pour tolérer les JQL encodés (`%20`, `+`) et variations de format. Cela évite des faux négatifs silencieux lorsque le client encode les espaces.

- Enrichissement des fixtures (MOYEN)
  - `__files/ticket-QAPI-123.json` : description technique multi-paragraphe ajoutée et champ `fields.comment` ajouté (2 commentaires d'exemple) pour améliorer la fidélité des tests RAG et des extractions de contexte.

- Authentification MCP Node.js (MOYEN)
  - `mcp/server.js` : middleware Bearer token ajouté (variable d'environement `MCP_TOKEN`, défaut `test-token`) protégeant toutes les routes sauf `/health`.
  - `docker-compose.yml` : variable `MCP_TOKEN` ajoutée au service `mcp`.

Validation

- Le projet compile localement (`mvn -DskipTests package` réussi).
- Les modifications ont été poussées sur la branche `fix/qa-audit-improvements` et une PR a été ouverte : https://github.com/isatis7/QapiRag-Jira-Mock/pull/25

Recommandations

- Lancer les tests d'intégration avec WireMock démarré pour valider les changements côté client :

```powershell
docker compose up -d
mvn -B test
```

---

Pour toute question ou si vous souhaitez que j'automatise des vérifications supplémentaires (tests de contrat, CI d'intégration), dites‑le et je l'implémente.

