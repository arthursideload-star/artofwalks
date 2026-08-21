"""Extraction helpers that read Airbnb's embedded state instead of its markup.

Airbnb ships its listing data as JSON inside <script> tags and re-skins the
surrounding HTML often. CSS selectors against that HTML break every few weeks;
the JSON keys are far more stable, so everything here works by walking the
embedded objects and picking values out by key name and shape.
"""

import json
import re
from typing import Any, Dict, Iterable, Iterator, List, Optional, Set

# Airbnb serves every listing photo from this CDN.
PICTURE_RE = re.compile(r"https://a0\.muscache\.com/im/pictures/[^\s\"'\\)]+", re.IGNORECASE)
SCRIPT_JSON_RE = re.compile(
    r"<script[^>]+type=[\"']application/json[\"'][^>]*>(.*?)</script>",
    re.IGNORECASE | re.DOTALL,
)
ROOM_ID_RE = re.compile(r"/rooms/(?:plus/)?(\d+)")
# Photo file names are UUID-ish; the same photo appears at many sizes under the
# same name, which makes the name the stable identity for de-duplication.
PHOTO_NAME_RE = re.compile(r"/([0-9a-f-]{12,}|[^/]+)\.(?:jpe?g|png|webp|avif)", re.IGNORECASE)
IM_W_RE = re.compile(r"[?&]im_w=(\d+)")


def iter_json_blobs(html: str) -> Iterator[Any]:
    """Yield every parseable <script type="application/json"> payload."""
    for match in SCRIPT_JSON_RE.finditer(html):
        raw = match.group(1).strip()
        if not raw:
            continue
        # Airbnb HTML-escapes a few characters inside these blobs.
        raw = raw.replace("<!--", "").replace("-->", "")
        try:
            yield json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            continue


def walk(node: Any) -> Iterator[Any]:
    """Depth-first walk over every dict and list node in a decoded blob."""
    stack = [node]
    while stack:
        current = stack.pop()
        yield current
        if isinstance(current, dict):
            stack.extend(current.values())
        elif isinstance(current, list):
            stack.extend(current)


def find_values(node: Any, *keys: str) -> Iterator[Any]:
    """Yield every value stored under any of `keys`, at any depth."""
    wanted = set(keys)
    for current in walk(node):
        if isinstance(current, dict):
            for key in wanted & current.keys():
                yield current[key]


def first_value(node: Any, *keys: str, predicate=None) -> Optional[Any]:
    for value in find_values(node, *keys):
        if value is None:
            continue
        if predicate is not None and not predicate(value):
            continue
        return value
    return None


def find_dicts_with(node: Any, *keys: str) -> Iterator[Dict[str, Any]]:
    """Yield dicts that carry all of `keys` — a cheap way to locate a record type."""
    wanted = set(keys)
    for current in walk(node):
        if isinstance(current, dict) and wanted <= current.keys():
            yield current


# ---------------------------------------------------------------- photos


def photo_identity(url: str) -> str:
    """Collapse the many rendered sizes of one photo onto a single identity."""
    base = url.split("?", 1)[0]
    match = PHOTO_NAME_RE.search(base)
    return match.group(1).lower() if match else base.lower()


def photo_urls(html: str) -> List[str]:
    """Every distinct listing photo on the page, largest variant of each kept."""
    best: Dict[str, str] = {}
    for url in PICTURE_RE.findall(html):
        url = url.replace("\\u002F", "/").replace("\\/", "/").rstrip("\\")
        identity = photo_identity(url)
        if identity not in best or _requested_width(url) > _requested_width(best[identity]):
            best[identity] = url
    return list(best.values())


def _requested_width(url: str) -> int:
    match = IM_W_RE.search(url)
    if match:
        return int(match.group(1))
    # An "/original/" variant has no width cap, so rank it above every sized one.
    return 10_000 if "/original/" in url else 0


def max_photo_width(urls: Iterable[str]) -> int:
    """Largest variant width Airbnb offers across the gallery.

    This reads the width Airbnb is willing to serve, not the intrinsic pixel size
    of the source file — verifying that needs an actual image fetch. In practice a
    gallery offering 1440px+ or /original/ variants was shot on a real camera.
    """
    return max((_requested_width(u) for u in urls), default=0)


# ---------------------------------------------------------------- ids


def room_ids(html: str) -> List[str]:
    """Listing ids linked from a search results page, in first-seen order."""
    seen: Set[str] = set()
    out: List[str] = []
    for match in ROOM_ID_RE.finditer(html):
        rid = match.group(1)
        if rid not in seen:
            seen.add(rid)
            out.append(rid)
    # Search results also appear as base64 "StayListing:<id>" ids inside the JSON.
    for blob in iter_json_blobs(html):
        for value in find_values(blob, "id", "listingId", "listing_id"):
            if isinstance(value, (str, int)):
                text = str(value)
                if text.isdigit() and 6 <= len(text) <= 20 and text not in seen:
                    seen.add(text)
                    out.append(text)
    return out
