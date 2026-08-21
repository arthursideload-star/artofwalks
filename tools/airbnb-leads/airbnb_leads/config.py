"""Config loading. TOML via the stdlib, so this adds no dependency."""

from __future__ import annotations

import tomllib
from pathlib import Path
from typing import Any


class ConfigError(RuntimeError):
    pass


DEFAULTS: dict[str, Any] = {
    "run": {"target_count": 100, "provider": "demo", "output_dir": "out"},
    "icp": {
        "titles": [],
        "seniorities": [],
        "keywords": [],
        "employee_ranges": ["1,10", "11,50", "51,200"],
        "regions": [],
    },
    "csv": {"path": "input/leads.csv"},
    "apollo": {
        "base_url": "https://api.apollo.io/v1",
        "enrich_emails": True,
        "max_credits": 120,
        "require_verified_email": True,
    },
    "pdf": {
        "title": "Lead List",
        "brand": "ArtOfWalks",
        "accent": "#1f6f5c",
        "include_detail_cards": True,
        "detail_card_limit": 25,
    },
}


def _merge(base: dict, override: dict) -> dict:
    out = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _merge(out[key], value)
        else:
            out[key] = value
    return out


def load(path: Path | str) -> dict[str, Any]:
    """Read a config file, layered over DEFAULTS.

    A missing file is not fatal - the defaults alone are a working demo config,
    which keeps `run.py --provider demo` usable straight after a clone.
    """
    path = Path(path)
    if not path.exists():
        return dict(DEFAULTS)
    try:
        with path.open("rb") as fh:
            raw = tomllib.load(fh)
    except tomllib.TOMLDecodeError as exc:
        raise ConfigError(f"{path} is not valid TOML: {exc}") from exc
    return _merge(DEFAULTS, raw)


def region_weights(cfg: dict[str, Any]) -> dict[str, float]:
    """country name (lowercased) -> weight."""
    weights: dict[str, float] = {}
    for entry in cfg.get("icp", {}).get("regions", []) or []:
        country = str(entry.get("country", "")).strip().lower()
        if country:
            weights[country] = float(entry.get("weight", 0.5))
    return weights
