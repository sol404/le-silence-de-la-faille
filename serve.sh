#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-8765}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Erreur : python3 (ou python) est introuvable dans WSL." >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "Serveur lancé pour : $ROOT_DIR"
echo "Ouvre ensuite dans ton navigateur : http://localhost:${PORT}/"
echo "Appuie sur Ctrl+C pour arrêter."
echo

exec "$PYTHON_BIN" -m http.server "$PORT" --bind 127.0.0.1
