# Conventions : mappings et fixtures

But : garder une structure claire et stable pour que le client MCP puisse consommer les réponses attendues.

Structure recommandée :
- `mappings/` : fichiers JSON WireMock décrivant request -> response
- `__files/` : corps de réponse référencés par `bodyFileName`

Règles de nommage :
- mappings : `mappings/<method>-<path>-<scenario>.json` (ex : `get-ticket-success.json`)
- fixtures : `__files/<resource>-<key>.json` (ex : `ticket-QAPI-123.json`)

Bonnes pratiques dans les mappings :
- Utiliser `urlPath` / `urlPathPattern` pour matcher les chemins.
- Utiliser `queryParameters` pour matcher les JQL / expand.
- Exiger `Authorization` via `headers` si le scénario doit tester la 401.
- Utiliser `priority` pour régler conflits (1 = plus prioritaire).
- Référencer les réponses volumineuses via `bodyFileName`.

Exemple (succinct) :
```json
{
  "request": { "method": "GET", "urlPath": "/rest/api/3/issue/QAPI-123", "headers": { "Authorization": { "matches": ".+" } } },
  "response": { "status": 200, "bodyFileName": "ticket-QAPI-123.json", "headers": { "Content-Type": "application/json" } }
}
```

Validation des fixtures :
- Assurez-vous que les champs attendus par le client existent : `key`, `id`, `fields.summary`, `fields.status.name`, `fields.assignee.displayName`.
- Gardez les dates ISO8601 si le client les parse.
