explanation: add docs index to organize existing docs and avoid duplicates
# Documentation — index

Ce dossier contient la documentation opérationnelle et les guides pour le projet.

Fichiers importants
- `ARCHITECTURE.md` — architecture et décisions techniques
- `ci.md` — exemple de workflow CI (GitHub Actions) pour lancer WireMock et exécuter les tests MCP

But du dossier
- Centraliser la documentation pour éviter doublons
- Fournir un guide "quickstart" pour développeurs et CI
- Décrire le modèle de fixtures/mappings et bonnes pratiques pour les tests

Proposition d'organisation future
- `docs/ARCHITECTURE.md` (existant)
- `docs/ci.md` (existant)
- `docs/fixtures.md` (nouveau) : guide pour ajouter fixtures et mappings WireMock
- `docs/runbook.md` (nouveau) : procedures operationnelles (rebuild, debug, logs)
- `docs/CHANGELOG.md` (nouveau) : changements significatifs

Comment contribuer à la doc
- Modifie ou ajoute des fichiers sous `docs/` et ouvre une PR vers `develop`.
- Evite de dupliquer les informations entre le README racine et `docs/` — le README doit rester un guide court et renvoyer vers `docs/` pour les détails.


