#!/usr/bin/env bash
# Prepares a session to run the lead pipeline.
#
# Use it as the setup script of a cloud environment (it runs after the repo is
# cloned, before Claude starts), or run it by hand after a fresh checkout.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

echo "==> Installing Python dependencies"
# --ignore-installed PyJWT: Scrapling's extras pull a newer PyJWT, and pip cannot
# uninstall the one Debian ships (no RECORD file), which aborts the whole install.
pip install --quiet -r requirements.txt --ignore-installed PyJWT

echo "==> Installing browser dependencies"
if scrapling install --force >/tmp/scrapling-install.log 2>&1; then
    echo "    Scrapling installed its own browser."
else
    # Locked-down networks block the Playwright CDN. Many images ship a Chromium
    # anyway, so point the pipeline at that instead of failing the whole setup.
    echo "    Download failed (see /tmp/scrapling-install.log) — looking for a local Chromium."
    FOUND=""
    for candidate in \
        "${SCRAPLING_EXECUTABLE_PATH:-}" \
        /opt/pw-browsers/chromium-*/chrome-linux/chrome \
        /root/.cache/ms-playwright/chromium-*/chrome-linux/chrome \
        /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/google-chrome; do
        if [ -n "$candidate" ] && [ -x "$candidate" ]; then
            FOUND="$candidate"
            break
        fi
    done

    if [ -n "$FOUND" ]; then
        echo "    Using $FOUND"
        python - "$FOUND" <<'PY'
import re
import sys
from pathlib import Path

path = Path("config.yaml")
config = path.read_text(encoding="utf-8")
updated = re.sub(r'^(\s*executable_path:\s*).*$', rf'\g<1>"{sys.argv[1]}"', config, count=1, flags=re.M)
path.write_text(updated, encoding="utf-8")
print("    Wrote executable_path into config.yaml")
PY
    else
        echo "    No Chromium found. Set scraping.fetcher: plain in config.yaml to run without one."
    fi
fi

echo "==> Verifying"
python -m unittest discover -s tests -t . 2>&1 | tail -3
echo "==> Ready. Run: python run.py"
