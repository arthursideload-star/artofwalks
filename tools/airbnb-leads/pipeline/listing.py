"""Stage 2 — pull one listing's detail page and decide whether it qualifies."""

import logging
import re
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional

from . import jsonwalk
from .config import Config
from .fetch import Fetcher

log = logging.getLogger(__name__)

LISTING_URL = "https://www.airbnb.com/rooms/{listing_id}"

BEDROOM_RE = re.compile(r"(\d+)\s*(?:bedroom|schlafzimmer|chambre|dormitorio|camera da letto)", re.IGNORECASE)
GUEST_RE = re.compile(r"(\d+)\s*(?:guests?|g(?:ä|a)ste|voyageurs|h(?:ó|o)spedes|ospiti)", re.IGNORECASE)
BED_RE = re.compile(r"(\d+)\s*(?:beds?|betten)", re.IGNORECASE)


@dataclass
class Listing:
    listing_id: str
    market: str = ""
    url: str = ""
    title: str = ""
    property_type: str = ""
    city: str = ""
    country: str = ""
    person_capacity: int = 0
    bedrooms: int = 0
    beds: int = 0
    bathrooms: int = 0
    photo_count: int = 0
    max_photo_width: int = 0
    rating: float = 0.0
    review_count: int = 0
    is_superhost: bool = False
    host_name: str = ""
    host_id: str = ""
    host_is_business: bool = False
    listings_by_host: int = 0
    description: str = ""
    external_links: List[str] = field(default_factory=list)
    reject_reason: str = ""

    def as_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _int(value: Any) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def parse(listing_id: str, html: str, market: str = "") -> Listing:
    """Read a listing page into a Listing record.

    Everything here is pulled out of the embedded JSON by key name, then falls
    back to reading the rendered text, because Airbnb ships several page variants
    and no single key is present in all of them.
    """
    out = Listing(listing_id=listing_id, market=market, url=LISTING_URL.format(listing_id=listing_id))
    blobs = list(jsonwalk.iter_json_blobs(html))

    for blob in blobs:
        out.title = out.title or _text(jsonwalk.first_value(blob, "listingTitle", "title", "name"))
        out.property_type = out.property_type or _text(
            jsonwalk.first_value(blob, "roomTypeCategory", "propertyType", "spaceType")
        )
        out.city = out.city or _text(jsonwalk.first_value(blob, "city", "localizedCity"))
        out.country = out.country or _text(jsonwalk.first_value(blob, "country", "countryCode"))
        out.person_capacity = out.person_capacity or _int(
            jsonwalk.first_value(blob, "personCapacity", "person_capacity", "guestLabel")
        )
        out.bedrooms = out.bedrooms or _int(jsonwalk.first_value(blob, "bedrooms", "bedroomLabel"))
        out.beds = out.beds or _int(jsonwalk.first_value(blob, "beds", "bedLabel"))
        out.bathrooms = out.bathrooms or _int(jsonwalk.first_value(blob, "bathrooms", "baths"))
        out.rating = out.rating or _float(
            jsonwalk.first_value(blob, "starRating", "avgRating", "guestSatisfactionOverall")
        )
        out.review_count = out.review_count or _int(
            jsonwalk.first_value(blob, "visibleReviewCount", "reviewsCount", "reviewCount")
        )
        out.host_name = out.host_name or _text(jsonwalk.first_value(blob, "hostName", "smartName"))
        out.host_id = out.host_id or _text(jsonwalk.first_value(blob, "hostId", "userId"))
        out.description = out.description or _text(
            jsonwalk.first_value(blob, "htmlDescription", "description", "sectionedDescription")
        )
        if not out.is_superhost:
            out.is_superhost = bool(jsonwalk.first_value(blob, "isSuperhost", "is_superhost"))
        if not out.host_is_business:
            out.host_is_business = bool(jsonwalk.first_value(blob, "isBusinessHost", "isProfessionalHost"))
        out.listings_by_host = out.listings_by_host or _int(
            jsonwalk.first_value(blob, "listingsCount", "totalListingsCount")
        )

    text = re.sub(r"<[^>]+>", " ", html)
    if not out.bedrooms:
        out.bedrooms = _first_match(BEDROOM_RE, text)
    if not out.person_capacity:
        out.person_capacity = _first_match(GUEST_RE, text)
    if not out.beds:
        out.beds = _first_match(BED_RE, text)

    photos = jsonwalk.photo_urls(html)
    out.photo_count = len(photos)
    out.max_photo_width = jsonwalk.max_photo_width(photos)
    out.external_links = _external_links(out.description, text)
    return out


def _text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        for key in ("htmlText", "text", "title", "localizedStringWithHtml"):
            if key in value:
                return _text(value[key])
        return ""
    if isinstance(value, list):
        return " ".join(_text(v) for v in value)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", str(value))).strip()


def _first_match(pattern: re.Pattern, text: str) -> int:
    match = pattern.search(text)
    return int(match.group(1)) if match else 0


# Host-written URLs are messy: ports, query strings, and a sentence-ending period
# stuck to the end. The pattern takes the whole URL, then the trailing punctuation
# is trimmed off separately.
URL_IN_TEXT_RE = re.compile(
    r"(?:https?://|www\.)"          # scheme or bare www.
    r"[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}"  # host with a real TLD
    r"(?::\d{2,5})?"                # optional port
    r"(?:/[^\s\"'<>]*)?",           # optional path, query and fragment
    re.IGNORECASE,
)
TRAILING_PUNCT = ".,;:!?)]}\u00bb\u201d\u2019\'\""
IG_RE = re.compile(r"(?:instagram\.com/|@)([a-z0-9._]{3,30})", re.IGNORECASE)
# Airbnb's own domains and the CDNs it embeds are never a host's own website.
IGNORED_HOSTS = (
    "airbnb.", "muscache.", "google.", "gstatic.", "facebook.com/tr", "schema.org",
    "w3.org", "doubleclick", "googletagmanager", "cloudflare", "gstatic", "apple.com",
)


def _external_links(description: str, page_text: str) -> List[str]:
    """Websites a host named themselves — the best route to a phone number.

    Only the description is mined, not the whole page: the rest of the document is
    full of Airbnb's own infrastructure URLs.
    """
    found: List[str] = []
    for candidate in URL_IN_TEXT_RE.findall(description or ""):
        candidate = candidate.rstrip(TRAILING_PUNCT)
        low = candidate.lower()
        if any(bad in low for bad in IGNORED_HOSTS):
            continue
        url = candidate if low.startswith("http") else f"https://{candidate}"
        if url not in found:
            found.append(url)
    for handle in IG_RE.findall(description or ""):
        url = f"https://www.instagram.com/{handle}/"
        if url not in found:
            found.append(url)
    return found[:5]


def qualifies(listing: Listing, cfg: Config) -> bool:
    """Apply the target profile. Sets reject_reason so runs stay debuggable."""
    f = cfg.filters
    if listing.photo_count < f.min_photos:
        listing.reject_reason = f"only {listing.photo_count} photos (need {f.min_photos})"
        return False
    if listing.max_photo_width and listing.max_photo_width < f.min_photo_width:
        listing.reject_reason = f"photos capped at {listing.max_photo_width}px"
        return False
    if listing.bedrooms and listing.bedrooms < f.min_bedrooms:
        listing.reject_reason = f"{listing.bedrooms} bedrooms (need {f.min_bedrooms})"
        return False
    if listing.person_capacity and listing.person_capacity < f.min_guests:
        listing.reject_reason = f"sleeps {listing.person_capacity} (need {f.min_guests})"
        return False
    if listing.review_count and listing.review_count < f.min_reviews:
        listing.reject_reason = f"{listing.review_count} reviews (need {f.min_reviews})"
        return False
    if listing.rating and listing.rating < f.min_rating:
        listing.reject_reason = f"rated {listing.rating} (need {f.min_rating})"
        return False
    listing.reject_reason = ""
    return True


def load(fetcher: Fetcher, listing_id: str, market: str) -> Optional[Listing]:
    url = LISTING_URL.format(listing_id=listing_id)
    html = fetcher.get(url, render=True, wait_selector='[data-section-id], [data-testid="pdp-title"]')
    if not html:
        return None
    return parse(listing_id, html, market)
