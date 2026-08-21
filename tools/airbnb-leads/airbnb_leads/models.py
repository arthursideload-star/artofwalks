"""Data model shared by every provider."""

from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict
from typing import Any

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$", re.I)


@dataclass
class Lead:
    """One prospect: a person at a company that manages holiday lets."""

    company: str
    contact_name: str = ""
    title: str = ""
    email: str = ""
    email_status: str = ""          # verified | likely | unverified | ""
    phone: str = ""
    website: str = ""
    city: str = ""
    country: str = ""
    employees: str = ""
    listings: str = ""              # managed-listing count, when the source knows it
    source: str = ""
    source_url: str = ""
    notes: str = ""

    # Filled in by scoring.py.
    score: int = 0
    score_reasons: list[str] = field(default_factory=list)

    @property
    def has_usable_email(self) -> bool:
        return bool(self.email) and bool(_EMAIL_RE.match(self.email))

    @property
    def is_verified(self) -> bool:
        return self.email_status.lower() == "verified"

    @property
    def dedupe_key(self) -> str:
        """Prefer email; fall back to company+person so CSV rows without an
        address still collapse sensibly."""
        if self.has_usable_email:
            return self.email.strip().lower()
        return f"{self.company.strip().lower()}|{self.contact_name.strip().lower()}"

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["score_reasons"] = "; ".join(self.score_reasons)
        return d


def dedupe(leads: list[Lead]) -> list[Lead]:
    """Drop repeats, keeping the highest-scoring copy of each key."""
    best: dict[str, Lead] = {}
    for lead in leads:
        key = lead.dedupe_key
        if key not in best or lead.score > best[key].score:
            best[key] = lead
    return list(best.values())
