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
  "request": { "method": "GET", "urlPath": "/rest/api/2/issue/QAPI-123", "headers": { "Authorization": { "matches": ".+" } } },
  "response": { "status": 200, "bodyFileName": "ticket-QAPI-123.json", "headers": { "Content-Type": "application/json" } }
}
```

Versions d'API réellement consommées (#26, alignées sur `fr.WATV.client.JiraClient`,
repo QapiRagPOC) : `/rest/api/2/issue/{key}` (get + changelog via `?expand=changelog`,
v2 car v3 renvoie `description` en objet ADF plutôt qu'en texte brut) et
`/rest/api/3/search/jql` (recherche JQL — l'ancien `/rest/api/{2,3}/search` a été
déprécié puis supprimé par Atlassian Cloud, 410 Gone). Le nouvel endpoint de
recherche ne renvoie plus `total`/`startAt` — seuls `issues`/`nextPageToken`/
`isLast` existent.

Validation des fixtures :
- Assurez-vous que les champs attendus par le client existent : `key`, `id`, `fields.summary`, `fields.status.name`, `fields.assignee.displayName`.
- Gardez les dates ISO8601 si le client les parse.
