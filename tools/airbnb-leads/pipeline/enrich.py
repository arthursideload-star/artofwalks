"""Stage 3 — find a phone number for the people behind a listing.

Airbnb never publishes host phone numbers; contact runs through its own
messaging. So a number has to come from a second source: the host's own website,
their Instagram, or the business that manages the property. This module walks
that chain and validates whatever it finds.
"""

import logging
import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import quote_plus, urljoin, urlsplit

import phonenumbers

from .config import Config
from .fetch import Fetcher
from .listing import Listing

log = logging.getLogger(__name__)

TEL_RE = re.compile(r"tel:([+0-9()\s.\-]{6,25})", re.IGNORECASE)
EMAIL_RE = re.compile(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", re.IGNORECASE)
CONTACT_HINT_RE = re.compile(
    r"(contact|kontakt|impressum|imprint|about|ueber-uns|über-uns|legal|reach-us|"
    r"contacto|contatti|contactez|mentions-legales)",
    re.IGNORECASE,
)
TAG_RE = re.compile(r"<(script|style)[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)

# Booking sites list their own call centre, never the host's line.
OTA_DOMAINS = (
    "booking.com", "expedia.", "vrbo.", "tripadvisor.", "agoda.", "hotels.com",
    "airbnb.", "trivago.", "kayak.", "homeaway.", "hostelworld.", "marriott.",
)
# Country names as they appear in config markets, mapped to phone regions so that
# national-format numbers ("089 1234567") still parse.
COUNTRY_REGIONS: Dict[str, str] = {
    "spain": "ES", "italy": "IT", "portugal": "PT", "greece": "GR", "croatia": "HR",
    "france": "FR", "united kingdom": "GB", "netherlands": "NL", "belgium": "BE",
    "germany": "DE", "austria": "AT", "switzerland": "CH", "canada": "CA",
    "mexico": "MX", "dominican republic": "DO", "indonesia": "ID", "thailand": "TH",
    "united arab emirates": "AE", "morocco": "MA", "south africa": "ZA",
    "australia": "AU", "new zealand": "NZ", "argentina": "AR", "brazil": "BR",
    # US states appear instead of the country name in the market list.
    "florida": "US", "arizona": "US", "california": "US", "colorado": "US",
    "tennessee": "US", "georgia": "US", "texas": "US", "new york": "US",
    "massachusetts": "US",
}


@dataclass
class Contact:
    phone: str = ""
    phone_source: str = ""
    email: str = ""
    website: str = ""
    instagram: str = ""

    @property
    def found(self) -> bool:
        return bool(self.phone)


def region_for(listing: Listing) -> Optional[str]:
    """Best guess at the listing's phone region, for parsing local formats.

    The configured market wins over the country scraped off the page: the market
    is ours and always well-formed, while the page's country field varies between
    a name, an ISO code, and occasionally the wrong nested value.
    """
    for source in (listing.market, listing.country, listing.city):
        region = _region_from(source)
        if region:
            return region
    code = (listing.country or "").strip().upper()
    return code if len(code) == 2 and code.isalpha() else None


def _region_from(text: str) -> Optional[str]:
    low = (text or "").lower()
    if not low:
        return None
    # Longest name first, so "united kingdom" is not shadowed by a shorter entry.
    for name in sorted(COUNTRY_REGIONS, key=len, reverse=True):
        if name in low:
            return COUNTRY_REGIONS[name]
    return None


def strip_markup(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", TAG_RE.sub(" ", html))


def phones_in(html: str, region: Optional[str], require_international: bool) -> List[str]:
    """Every valid phone number on a page, most trustworthy first.

    tel: links come first: a number the site owner marked up as callable beats one
    matched out of body text, which is often an order id or a licence number.
    """
    ordered: List[str] = []
    seen: Set[str] = set()

    def add(raw: str) -> None:
        for match in phonenumbers.PhoneNumberMatcher(raw, region, leniency=phonenumbers.Leniency.VALID):
            if require_international and not phonenumbers.is_valid_number(match.number):
                continue
            formatted = phonenumbers.format_number(match.number, phonenumbers.PhoneNumberFormat.E164)
            if formatted not in seen:
                seen.add(formatted)
                ordered.append(formatted)

    for tel in TEL_RE.findall(html):
        add(tel if tel.strip().startswith("+") else tel)
    add(strip_markup(html))
    return ordered


MAILTO_RE = re.compile(r"mailto:([^\"'?>\s]+)", re.IGNORECASE)


def emails_in(html: str) -> List[str]:
    """Addresses on a page — mailto: links first, then anything in the body text.

    mailto: targets sit in an href attribute, so they have to be read before the
    markup is stripped, or they disappear with the tag.
    """
    out: List[str] = []
    for candidate in MAILTO_RE.findall(html) + EMAIL_RE.findall(strip_markup(html)):
        low = candidate.lower()
        if any(low.endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".gif", ".webp")):
            continue
        if low.startswith(("example@", "name@", "your@", "email@")):
            continue
        if low not in out:
            out.append(low)
    return out


def contact_pages(html: str, base_url: str, limit: int) -> List[str]:
    """Links on a site that look like they lead to a contact or imprint page."""
    out: List[str] = []
    for match in re.finditer(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE):
        href = match.group(1)
        if not CONTACT_HINT_RE.search(href):
            continue
        url = urljoin(base_url, href)
        if url.startswith("http") and url not in out and urlsplit(url).netloc == urlsplit(base_url).netloc:
            out.append(url)
        if len(out) >= limit:
            break
    return out


class PhoneFinder:
    """Runs the enrichment chain and screens out numbers that aren't the host's."""

    def __init__(self, fetcher: Fetcher, cfg: Config):
        self.fetcher = fetcher
        self.cfg = cfg
        # A number appearing across many unrelated domains belongs to a platform,
        # a plugin vendor, or a booking widget — not to any one property.
        self._domains_per_phone: Dict[str, Set[str]] = defaultdict(set)

    def _note(self, phone: str, url: str) -> None:
        self._domains_per_phone[phone].add(urlsplit(url).netloc.lower().removeprefix("www."))

    def _is_shared(self, phone: str) -> bool:
        return len(self._domains_per_phone.get(phone, ())) > 3

    def find(self, listing: Listing) -> Contact:
        region = region_for(listing)
        require = self.cfg.enrichment.require_international_format
        budget = self.cfg.enrichment.max_pages_per_listing
        contact = Contact()

        for source in self.cfg.enrichment.sources:
            if contact.found:
                break
            if source == "listing_text":
                self._from_listing_text(listing, region, require, contact)
            elif source == "host_links":
                budget = self._from_host_links(listing, region, require, contact, budget)
            elif source == "web_search":
                budget = self._from_web_search(listing, region, require, contact, budget)
        return contact

    # -- sources ------------------------------------------------------

    def _from_listing_text(self, listing: Listing, region, require, contact: Contact) -> None:
        for phone in phones_in(listing.description, region, require):
            contact.phone, contact.phone_source = phone, "listing description"
            return

    def _from_host_links(self, listing: Listing, region, require, contact: Contact, budget: int) -> int:
        for link in listing.external_links:
            if contact.found or budget <= 0:
                break
            if "instagram.com" in link:
                contact.instagram = contact.instagram or link
                continue
            budget = self._mine_site(link, region, require, contact, budget, "host website")
        return budget

    def _from_web_search(self, listing: Listing, region, require, contact: Contact, budget: int) -> int:
        query = " ".join(x for x in (listing.title, listing.city, listing.market, "contact phone") if x)
        for candidate in self._search(query):
            if contact.found or budget <= 0:
                break
            budget = self._mine_site(candidate, region, require, contact, budget, "web search")
        return budget

    def _search(self, query: str) -> List[str]:
        """DuckDuckGo's HTML endpoint — no API key, no JS needed."""
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        html = self.fetcher.get(url)
        if not html:
            return []
        results: List[str] = []
        for match in re.finditer(r'href="(https?://[^"]+)"', html):
            link = match.group(1)
            host = urlsplit(link).netloc.lower()
            if any(bad in host for bad in OTA_DOMAINS) or "duckduckgo" in host:
                continue
            if link not in results:
                results.append(link)
            if len(results) >= 5:
                break
        return results

    def _mine_site(self, url: str, region, require, contact: Contact, budget: int, label: str) -> int:
        html = self.fetcher.get(url)
        budget -= 1
        if not html:
            return budget

        contact.website = contact.website or url
        contact.email = contact.email or next(iter(emails_in(html)), "")

        for phone in phones_in(html, region, require):
            self._note(phone, url)
            if not self._is_shared(phone):
                contact.phone, contact.phone_source = phone, f"{label} ({urlsplit(url).netloc})"
                return budget

        # Nothing on the landing page — the number usually lives on contact/imprint.
        for sub in contact_pages(html, url, limit=2):
            if budget <= 0:
                break
            sub_html = self.fetcher.get(sub)
            budget -= 1
            if not sub_html:
                continue
            contact.email = contact.email or next(iter(emails_in(sub_html)), "")
            for phone in phones_in(sub_html, region, require):
                self._note(phone, sub)
                if not self._is_shared(phone):
                    contact.phone, contact.phone_source = phone, f"{label} ({urlsplit(sub).netloc})"
                    return budget
        return budget
