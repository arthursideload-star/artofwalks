"""Normalise, score and export a list you already own.

This is the path to use for a list bought from a data vendor, exported from a
CRM, or built by hand - it does no collection of its own.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from ..models import Lead
from .base import Provider, ProviderError

# Accepted spellings for each Lead field, matched case/space-insensitively.
_ALIASES: dict[str, tuple[str, ...]] = {
    "company": ("company", "company name", "organisation", "organization", "account"),
    "contact_name": ("contact_name", "name", "full name", "contact"),
    "title": ("title", "job title", "position", "role"),
    "email": ("email", "email address", "work email"),
    "email_status": ("email_status", "email status", "status"),
    "phone": ("phone", "telephone", "mobile", "phone number"),
    "website": ("website", "url", "domain", "company website"),
    "city": ("city", "town", "locality"),
    "country": ("country", "country name"),
    "employees": ("employees", "employee count", "headcount", "size"),
    "listings": ("listings", "listing count", "properties", "units"),
    "source_url": ("source_url", "source url", "profile", "linkedin"),
}


def _norm(header: str) -> str:
    return header.strip().lower().replace("_", " ")


class CsvProvider(Provider):
    @property
    def name(self) -> str:
        return "csv"

    def describe(self) -> str:
        return f"CSV import from {self.cfg.get('csv', {}).get('path', '?')}"

    def fetch(self, target_count: int) -> list[Lead]:
        path = Path(self.cfg.get("csv", {}).get("path", "input/leads.csv"))
        if not path.exists():
            raise ProviderError(
                f"CSV not found at {path}. Set [csv].path in config.toml, "
                "or pass --provider demo to try the pipeline without one."
            )

        with path.open(newline="", encoding="utf-8-sig") as fh:
            reader = csv.DictReader(fh)
            if not reader.fieldnames:
                raise ProviderError(f"{path} has no header row.")

            # header-as-written -> Lead field
            mapping: dict[str, str] = {}
            for header in reader.fieldnames:
                normalised = _norm(header)
                for target, names in _ALIASES.items():
                    if normalised in {_norm(n) for n in names}:
                        mapping[header] = target
                        break

            if "company" not in mapping.values() and "email" not in mapping.values():
                raise ProviderError(
                    f"{path} needs at least a company or email column; "
                    f"found: {', '.join(reader.fieldnames)}"
                )

            leads: list[Lead] = []
            for row in reader:
                if len(leads) >= target_count:
                    break
                fields: dict[str, Any] = {}
                extras: list[str] = []
                for header, value in row.items():
                    if value is None or not str(value).strip():
                        continue
                    value = str(value).strip()
                    if header in mapping:
                        fields[mapping[header]] = value
                    else:
                        extras.append(f"{header}: {value}")
                if not fields.get("company") and not fields.get("email"):
                    continue  # skip blank/padding rows
                fields.setdefault("company", fields.get("email", "").split("@")[-1])
                fields["source"] = "csv"
                if extras:
                    fields["notes"] = " | ".join(extras)
                leads.append(Lead(**fields))
        return leads
