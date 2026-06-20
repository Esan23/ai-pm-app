#!/usr/bin/env bash
set -euo pipefail
REPO="ai-pm-app"
USER="Esan23"
VIS="private"   # change to "public" if you prefer

if command -v gh >/dev/null 2>&1; then
  echo "Creating $VIS repo and pushing via GitHub CLI..."
  gh repo create "$REPO" --"$VIS" --source=. --remote=origin --push
else
  echo "gh CLI not found."
  echo "1) Create an EMPTY repo named '$REPO' at https://github.com/new (owner: $USER)"
  echo "2) Re-run this script to push."
  git remote add origin "https://github.com/$USER/$REPO.git" 2>/dev/null \
    || git remote set-url origin "https://github.com/$USER/$REPO.git"
  git branch -M main
  git push -u origin main
fi
echo "Done -> https://github.com/$USER/$REPO"
