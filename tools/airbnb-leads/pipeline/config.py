"""Loads config.yaml and exposes it as plain dataclasses."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List

import yaml


@dataclass
class ListingFilters:
    room_type: str = "Entire home/apt"
    min_bedrooms: int = 4
    min_guests: int = 8
    min_photos: int = 25
    min_photo_width: int = 1200
    min_reviews: int = 5
    min_rating: float = 4.5


@dataclass
class Enrichment:
    sources: List[str] = field(default_factory=lambda: ["listing_text", "host_links", "web_search"])
    require_international_format: bool = True
    max_pages_per_listing: int = 4


@dataclass
class Scraping:
    delay_seconds: float = 3.0
    fetcher: str = "stealthy"
    headless: bool = True
    timeout_ms: int = 45000
    retries: int = 2
    max_search_pages: int = 8


@dataclass
class Output:
    directory: str = "out"
    csv_name: str = "artofwalks-leads.csv"
    xlsx_name: str = "artofwalks-leads.xlsx"
    cache_db: str = "out/cache.sqlite3"


@dataclass
class Config:
    leads_wanted: int
    require_phone: bool
    filters: ListingFilters
    enrichment: Enrichment
    scraping: Scraping
    output: Output
    markets: Dict[str, List[str]]
    root: Path

    @property
    def all_markets(self) -> List[str]:
        """Every configured market, interleaved across regions.

        Interleaving matters: taking regions in order would fill the first 100
        leads entirely from southern Europe and never reach Asia or the US.
        """
        buckets = [list(v) for v in self.markets.values() if v]
        out: List[str] = []
        for i in range(max((len(b) for b in buckets), default=0)):
            for bucket in buckets:
                if i < len(bucket):
                    out.append(bucket[i])
        return out

    def out_path(self, name: str) -> Path:
        p = self.root / self.output.directory / name
        p.parent.mkdir(parents=True, exist_ok=True)
        return p


def load(path: str | Path) -> Config:
    path = Path(path)
    raw: Dict[str, Any] = yaml.safe_load(path.read_text(encoding="utf-8"))

    target = raw.get("target", {})
    out = Output(**raw.get("output", {}))
    return Config(
        leads_wanted=int(target.get("leads_wanted", 100)),
        require_phone=bool(target.get("require_phone", True)),
        filters=ListingFilters(**raw.get("listing_filters", {})),
        enrichment=Enrichment(**raw.get("enrichment", {})),
        scraping=Scraping(**raw.get("scraping", {})),
        output=out,
        markets=raw.get("markets", {}),
        root=path.parent,
    )
