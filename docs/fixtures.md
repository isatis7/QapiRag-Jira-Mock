# Fixtures et mappings WireMock

But: documenter la structure des fixtures et la manière d'ajouter de nouveaux cas de test.

Structure
- `mappings/` : fichiers JSON qui décrivent les mappings WireMock
- `__files/` : réponses (fixtures) retournées par WireMock

Ajouter un nouveau ticket (ex: QAPI-999)
1. Créer le fixture JSON dans `__files/ticket-QAPI-999.json`.
2. Créer un mapping dans `mappings/get-ticket-QAPI-999.json` pointant vers `/rest/api/3/issue/QAPI-999` et retournant le fichier `ticket-QAPI-999.json`.
3. Redémarrer WireMock ou utiliser l'API admin `__admin/mappings` pour recharger.

Best practices
- Toujours valider la syntaxe JSON (`jq . file.json`) avant d'ajouter au repo.
- Garder les fixtures aussi petites que nécessaire pour couvrir le cas testé.
- Versionner les modifications de fixtures et mappings via PR pour traçabilité.

Exemple de mapping (squelette)
```json
{
  "request": {
    "method": "GET",
    "urlPath": "/rest/api/3/issue/QAPI-999",
    "headers": {
      "Authorization": {
        "matches": ".*"
      }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      // contenu du ticket ou utiliser "bodyFileName": "ticket-QAPI-999.json"
    },
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

