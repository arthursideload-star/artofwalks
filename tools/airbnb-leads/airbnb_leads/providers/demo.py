"""Synthetic rows for exercising the pipeline without network or credits.

Everything here is fabricated on purpose. Addresses all sit on example.com,
which RFC 2606 reserves precisely so sample data cannot reach a real inbox.
Runs from this provider are stamped SAMPLE DATA on every page of the PDF so a
demo export can never be mistaken for a real list.
"""

from __future__ import annotations

import random
from typing import Any

from ..models import Lead
from .base import Provider

_CITIES = [
    ("Athens", "Greece"), ("Thessaloniki", "Greece"), ("Chania", "Greece"),
    ("Barcelona", "Spain"), ("Malaga", "Spain"), ("Palma", "Spain"),
    ("Lisbon", "Portugal"), ("Porto", "Portugal"), ("Faro", "Portugal"),
    ("Rome", "Italy"), ("Florence", "Italy"), ("Naples", "Italy"),
    ("Split", "Croatia"), ("Dubrovnik", "Croatia"),
    ("Nice", "France"), ("Marseille", "France"),
]
_PREFIX = ["Azure", "Coastal", "Olive", "Harbour", "Terrace", "Lantern",
           "Sunset", "Marina", "Cobalt", "Almond", "Vista", "Anchor"]
_SUFFIX = ["Stays", "Rentals", "Hosting", "Property Management",
           "Vacation Homes", "Villa Management", "Short Lets"]
_TITLES = ["Founder", "Managing Director", "Owner", "Head of Marketing",
           "Property Manager", "Operations Manager", "Marketing Manager"]
_SIZES = ["1-10", "11-50", "51-200"]
_FIRST = ["Alex", "Marta", "Nikos", "Sofia", "Luca", "Ines", "Petar",
          "Camille", "Elena", "Tomas", "Rita", "Andreas"]
_LAST = ["Sample", "Placeholder", "Example", "Testcase", "Demo", "Fixture"]


class DemoProvider(Provider):
    synthetic = True

    @property
    def name(self) -> str:
        return "demo"

    def describe(self) -> str:
        return "Synthetic sample rows (example.com addresses - NOT real prospects)"

    def fetch(self, target_count: int) -> list[Lead]:
        # Seeded so repeated runs are reproducible and diffable.
        rng = random.Random(20260821)
        leads: list[Lead] = []
        for i in range(target_count):
            city, country = _CITIES[i % len(_CITIES)]
            company = f"{rng.choice(_PREFIX)} {rng.choice(_SUFFIX)}"
            first, last = rng.choice(_FIRST), rng.choice(_LAST)
            slug = company.lower().replace(" ", "")
            leads.append(Lead(
                company=f"{company} {city}",
                contact_name=f"{first} {last}",
                title=rng.choice(_TITLES),
                email=f"{first.lower()}.{last.lower()}{i}@example.com",
                email_status=rng.choice(["verified", "verified", "likely"]),
                phone="",
                website=f"https://{slug}.example.com",
                city=city,
                country=country,
                employees=rng.choice(_SIZES),
                listings=str(rng.randint(8, 140)),
                source="demo",
                notes="Synthetic vacation rental management sample row.",
            ))
        return leads
