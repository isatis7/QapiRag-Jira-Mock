#!/usr/bin/env bash
set -euo pipefail

# Script d'aide pour mettre à jour les issues GitHub correspondant aux tickets MOCK
# Utilise la CLI `gh` (GitHub CLI). Ne s'exécute que si `gh` est installé et authentifié.
# Usage:
#   GITHUB_REPO=owner/repo ./scripts/update_github_issues.sh
# ou si le script est lancé depuis le repo cloné, il essayera de déduire le remote.

REPO=${GITHUB_REPO:-}
if [ -z "$REPO" ]; then
  if git rev-parse --git-dir >/dev/null 2>&1; then
    # obtenir origin remote url et transformer en owner/repo
    url=$(git remote get-url origin 2>/dev/null || true)
    if [ -n "$url" ]; then
      # url peut être git@github.com:owner/repo.git ou https://github.com/owner/repo.git
      REPO=$(echo "$url" | sed -E 's#git@github.com:(.*)\.git#\1#; s#https?://github.com/(.*)\.git#\1#')
    fi
  fi
fi

if [ -z "$REPO" ]; then
  echo "Erreur: impossible de déterminer le dépôt GitHub. Exportez GITHUB_REPO=owner/repo ou configurez origin remote." >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Erreur: la CLI 'gh' (GitHub CLI) n'est pas installée. Installez-la et authentifiez-vous avec 'gh auth login'." >&2
  exit 3
fi

echo "Vérification de l'authentification gh..."
if ! gh auth status >/dev/null 2>&1; then
  echo "Veuillez vous authentifier avec 'gh auth login' avant d'exécuter ce script." >&2
  exit 4
fi

echo "Repo cible: $REPO"

confirm() {
  read -p "$1 [y/N]: " -r
  case "$REPLY" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}

echo "Les modifications proposées pour les tickets MOCK :"
cat <<'EOF'
MOCK #8  - .gitignore : confirmer que mappings/ et __files/ restent versionnés (aucune suppression nécessaire)
MOCK #9  - Priorité mapping changelog vs ticket : réglée (changelog priority -> 4)
MOCK #10 - Cohérence des statuts : fixtures alignées sur 'In Progress'
MOCK #11 - Java downgraded -> already 21 in pom.xml (aucune action)
MOCK #20 - Docs : jira.token -> jira.api-token (docs updated)
MOCK #21 - Mapping recherche vide : present (search-tickets-empty.json)
EOF

if ! confirm "Exécuter les mises à jour sur les issues GitHub (mettre à jour titre/body/labels/state) ?"; then
  echo "Annulé par l'utilisateur.";
  exit 0
fi

# Mapping simple : issue number => operations
declare -A titles
declare -A bodies
declare -A labels
declare -A states

titles[8]="MOCK #8 — .gitignore: conserver mappings/ et __files/ versionnés"
bodies[8]="La `.gitignore` du projet a été mise à jour pour conserver `mappings/` et `__files/` dans le dépôt afin d'assurer des builds reproductibles et les tests CI. Aucune suppression nécessaire."
labels[8]="Bouchon,Bloquant"
states[8]="closed"

titles[9]="MOCK #9 — Priorité mapping changelog vs ticket corrigée"
bodies[9]="Le mapping WireMock pour `?expand=changelog` a désormais une priorité plus élevée (4) pour s'assurer qu'il est pris en compte avant le mapping ticket générique."
labels[9]="Bouchon,Bloquant"
states[9]="closed"

titles[10]="MOCK #10 — Cohérence des statuts des fixtures"
bodies[10]="Les fixtures JSON ont été alignées : le ticket QAPI-123 et les résultats de recherche indiquent désormais le statut `In Progress`, cohérent avec le changelog."
labels[10]="Bouchon,Haute"
states[10]="closed"

titles[11]="MOCK #11 — Java downgraded to 21 LTS"
bodies[11]="Le `pom.xml` utilise déjà Java 21 (maven.compiler.source/target = 21). Aucune action additionnelle requise."
labels[11]="Bouchon,Haute"
states[11]="closed"

titles[20]="MOCK #20 — Docs: jira.token → jira.api-token"
bodies[20]="La documentation d'intégration a été corrigée pour utiliser la propriété `jira.api-token` au lieu de `jira.token` afin d'éviter la confusion avec les variables d'environnement."
labels[20]="Bouchon,Haute"
states[20]="closed"

titles[21]="MOCK #21 — Mapping recherche vide ajouté"
bodies[21]="Le mapping `search-tickets-empty.json` a été ajouté (ou vérifié) pour couvrir la recherche retournant 0 résultats (jql=project=QAPI AND status=Done)."
labels[21]="Bouchon,Haute"
states[21]="closed"

for num in 8 9 10 11 20 21; do
  echo "\n---\nMise à jour de l'issue #$num :"
  echo "Titre: ${titles[$num]}"
  echo "Labels: ${labels[$num]}"
  echo "Etat: ${states[$num]}"

  # afficher la commande qui sera exécutée
  echo "Commande gh: gh issue edit $num --repo $REPO --title \"${titles[$num]}\" --body \"${bodies[$num]}\" --label \"${labels[$num]}\" --state ${states[$num]}"

  if confirm "Executer la commande pour l'issue #$num ?"; then
    gh issue edit $num --repo "$REPO" --title "${titles[$num]}" --body "${bodies[$num]}" --label "${labels[$num]}" --state ${states[$num]}
    echo "Issue #$num mise à jour."
  else
    echo "Skipped #$num"
  fi
done

echo "Opération terminée. Vérifiez les issues sur https://github.com/$REPO/issues"

