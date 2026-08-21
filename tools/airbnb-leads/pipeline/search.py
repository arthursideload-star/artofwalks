"""Stage 1 — turn a market name into candidate listing ids."""

import logging
from typing import Iterator, List
from urllib.parse import quote, urlencode

from . import jsonwalk
from .config import Config
from .fetch import Fetcher

log = logging.getLogger(__name__)

SEARCH_BASE = "https://www.airbnb.com/s/{place}/homes"


def search_url(place: str, filters, page: int = 0) -> str:
    """Build an Airbnb search URL for one market.

    Airbnb paginates with a cursor, but `items_offset` in multiples of 18 still
    works and is far easier to drive than decoding the cursor.
    """
    params = [
        ("refinement_paths[]", "/homes"),
        ("room_types[]", filters.room_type),
        ("min_bedrooms", str(filters.min_bedrooms)),
        ("adults", str(filters.min_guests)),
        ("search_type", "filter_change"),
    ]
    if page:
        params.append(("items_offset", str(page * 18)))
    return f"{SEARCH_BASE.format(place=quote(place))}?{urlencode(params)}"


def candidate_ids(fetcher: Fetcher, place: str, cfg: Config) -> Iterator[str]:
    """Yield listing ids for one market, walking through the result pages."""
    seen: set[str] = set()
    for page in range(cfg.scraping.max_search_pages):
        url = search_url(place, cfg.filters, page)
        html = fetcher.get(url, render=True, wait_selector='[itemprop="itemListElement"], [data-testid="card-container"]')
        if not html:
            log.warning("no search results for %s (page %s)", place, page)
            return

        ids = [i for i in jsonwalk.room_ids(html) if i not in seen]
        if not ids:
            log.info("%s: no further results after page %s", place, page)
            return

        for listing_id in ids:
            seen.add(listing_id)
            yield listing_id


def collect(fetcher: Fetcher, cfg: Config, markets: List[str], per_market: int) -> Iterator[tuple[str, str]]:
    """Yield (listing_id, market) pairs across markets, round-robin by market.

    Capping each market keeps the final list geographically spread instead of
    100 villas from whichever region happened to be searched first.
    """
    for place in markets:
        taken = 0
        for listing_id in candidate_ids(fetcher, place, cfg):
            yield listing_id, place
            taken += 1
            if taken >= per_market:
                break
        log.info("%s: %s candidates", place, taken)
