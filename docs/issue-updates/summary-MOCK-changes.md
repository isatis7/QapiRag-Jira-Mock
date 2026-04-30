# Résumé des mises à jour pour tickets MOCK

Ce document récapitule les changements appliqués localement pour satisfaire les tickets listés dans le projet GitHub.

Tickets et actions réalisées

- MOCK #8 — .gitignore
  - Vérification : la `.gitignore` ne masque pas `mappings/` ni `__files/`. Ces dossiers doivent rester versionnés pour la reproductibilité.
  - Action : aucune suppression nécessaire. Documenté.

- MOCK #9 — Priorité WireMock (changelog vs ticket)
  - Problème : la requête `GET /rest/api/3/issue/QAPI-123?expand=changelog` pouvait matcher le mapping ticket générique au lieu du mapping changelog.
  - Action : `mappings/get-changelog-success.json` priority changée de 5 → 4.

- MOCK #10 — Cohérence des statuts
  - Problème : `__files/ticket-QAPI-123.json` indiquait `To Do` alors que `changelog-QAPI-123.json` indiquait `In Progress`.
  - Action : modifié `__files/ticket-QAPI-123.json` et `__files/search-results.json` pour utiliser `In Progress`.

- MOCK #11 — Java 24 → Java 21 LTS
  - Vérification : `pom.xml` contient déjà `maven.compiler.source` / `target` = 21. Aucune modification requise.

- MOCK #20 — Docs jira.token → jira.api-token
  - Action : `docs/integration-tests.md` mis à jour pour utiliser `jira.api-token` (et l'exemple DynamicPropertySource mis à jour).

- MOCK #21 — Mapping recherche vide
  - Vérification : `mappings/search-tickets-empty.json` et `__files/search-empty.json` présents et référencés.

Comment appliquer ces changements aux issues GitHub

J'ai ajouté un script pratique `scripts/update_github_issues.sh` qui utilise la CLI `gh` pour modifier les issues 8,9,10,11,20,21.

Usage recommandé :

1. Assurez-vous d'avoir `gh` installé et authentifié (gh auth login).
2. Depuis la racine du repo, exécutez :

```bash
GITHUB_REPO=owner/repo ./scripts/update_github_issues.sh
```

Le script propose chaque modification et demande confirmation avant d'appeler `gh issue edit`.

Si vous souhaitez que j'exécute les mises à jour directement (je ne peux pas pousser sur GitHub depuis cet environnement), exécutez le script ci‑dessus sur votre machine ou me donnez l'autorisation explicite et les informations d'accès (non recommandé). 

