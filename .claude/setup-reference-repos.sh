#!/usr/bin/env bash
# Klont die Referenz-Repos, mit denen Claude Code arbeiten soll.
#
#   ./.claude/setup-reference-repos.sh              -> nach ~/claude-repos
#   ./.claude/setup-reference-repos.sh ~/dev/refs   -> nach ~/dev/refs
#   FULL=1 ./.claude/setup-reference-repos.sh       -> volle History statt --depth 1
#
# Idempotent: vorhandene Clones werden aktualisiert, nicht neu geklont.

set -euo pipefail

WORKSPACE="${1:-$HOME/claude-repos}"

REPOS=(
  "https://github.com/cathrynlavery/diagram-design"
  "https://github.com/basecamp/omarchy"
  "https://github.com/coollabsio/coolify"
  "https://github.com/getmaxun/maxun"
  "https://github.com/Stirling-Tools/Stirling-PDF"
  "https://github.com/langgenius/dify"
  "https://github.com/MVCoconut/coconut.ui"
  "https://github.com/bklit/bklit-ui"
)

depth_args=(--depth 1)
[ "${FULL:-0}" = "1" ] && depth_args=()

mkdir -p "$WORKSPACE"
echo "Workspace: $WORKSPACE"
echo

failed=()

for url in "${REPOS[@]}"; do
  name="${url##*/}"
  target="$WORKSPACE/$name"

  if [ -d "$target/.git" ]; then
    actual="$(git -C "$target" remote get-url origin 2>/dev/null || echo '')"
    # Vergleich case-insensitiv und ohne optionales .git-Suffix
    if [ "$(echo "${actual%.git}" | tr 'A-Z' 'a-z')" != "$(echo "$url" | tr 'A-Z' 'a-z')" ]; then
      echo "!! $name: Ordner belegt von '$actual' -- uebersprungen"
      failed+=("$name (falsches Remote)")
      continue
    fi
    echo ">> $name: aktualisiere"
    git -C "$target" fetch --quiet origin && \
      git -C "$target" merge --quiet --ff-only @{u} 2>/dev/null || \
      echo "   (kein fast-forward moeglich -- lokale Aenderungen? uebersprungen)"
  else
    echo ">> $name: klone"
    # GIT_LFS_SKIP_SMUDGE nur noetig, falls kein git-lfs installiert ist.
    if ! GIT_LFS_SKIP_SMUDGE=1 git clone --quiet "${depth_args[@]}" "$url" "$target"; then
      echo "!! $name: Clone fehlgeschlagen"
      failed+=("$name (Clone-Fehler)")
      continue
    fi
  fi

  branch="$(git -C "$target" rev-parse --abbrev-ref HEAD)"
  echo "   OK  branch=$branch  $(du -sh "$target" | cut -f1)"
done

echo
if [ ${#failed[@]} -gt 0 ]; then
  echo "Fertig mit Problemen:"
  printf '  - %s\n' "${failed[@]}"
  exit 1
fi
echo "Alle ${#REPOS[@]} Repos bereit in $WORKSPACE"
