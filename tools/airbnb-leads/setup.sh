#!/usr/bin/env bash
# Create the virtualenv and install dependencies for the lead generator.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HERE/.venv"
PY="${PYTHON:-python3}"

echo "==> Using $($PY --version)"

if [ ! -d "$VENV" ]; then
  echo "==> Creating virtualenv at $VENV"
  "$PY" -m venv "$VENV"
else
  echo "==> Reusing existing virtualenv at $VENV"
fi

echo "==> Upgrading pip"
"$VENV/bin/pip" install --quiet --upgrade pip

echo "==> Installing dependencies"
"$VENV/bin/pip" install --quiet -r "$HERE/requirements.txt"

if [ ! -f "$HERE/config.toml" ]; then
  echo "==> Writing config.toml from config.example.toml"
  cp "$HERE/config.example.toml" "$HERE/config.toml"
fi

echo
echo "Setup complete."
echo "Next:  $VENV/bin/python $HERE/run.py --count 100"
echo "       (or activate with: source $VENV/bin/activate)"
