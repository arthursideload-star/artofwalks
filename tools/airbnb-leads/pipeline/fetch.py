"""One polite, cached way to pull a page, used by every stage."""

import logging
import os
import time
from typing import Dict, Optional
from urllib.parse import urlsplit

from .config import Scraping
from .store import Store

log = logging.getLogger(__name__)

# Page cache lifetime. Listings change slowly; a week-old copy is fine and saves
# both our runtime and Airbnb's bandwidth.
CACHE_TTL_SECONDS = 7 * 24 * 3600


class Fetcher:
    def __init__(self, store: Store, settings: Scraping):
        self.store = store
        self.settings = settings
        self._last_hit: Dict[str, float] = {}
        self._stealth = None

    # -- politeness ---------------------------------------------------

    def _wait_turn(self, url: str) -> None:
        """Space out requests per host, not globally."""
        host = urlsplit(url).netloc.lower()
        last = self._last_hit.get(host)
        if last is not None:
            remaining = self.settings.delay_seconds - (time.time() - last)
            if remaining > 0:
                time.sleep(remaining)
        self._last_hit[host] = time.time()

    # -- fetching -----------------------------------------------------

    def get(self, url: str, *, render: bool = False, wait_selector: Optional[str] = None) -> Optional[str]:
        """Return page HTML, from cache when we already have it.

        `render` drives a real browser. Airbnb listing pages need it — the photo
        manifest is injected by JS. Plain business websites do not, and the fast
        HTTP path handles them an order of magnitude quicker.
        """
        cached = self.store.get_page(url, max_age_seconds=CACHE_TTL_SECONDS)
        if cached is not None:
            log.debug("cache hit %s", url)
            return cached

        self._wait_turn(url)
        # `fetcher: plain` in the config forces the HTTP path everywhere, which is
        # what you want on a machine with no usable browser.
        use_browser = render and self.settings.use_browser
        html = self._render(url, wait_selector) if use_browser else self._plain(url)
        if html:
            self.store.put_page(url, html)
        return html

    def _plain(self, url: str) -> Optional[str]:
        from scrapling.fetchers import Fetcher as HttpFetcher

        for attempt in range(self.settings.retries + 1):
            try:
                page = HttpFetcher.get(
                    url,
                    timeout=self.settings.timeout_ms / 1000,
                    stealthy_headers=True,
                    follow_redirects=True,
                    impersonate="chrome",
                )
                if page is not None and page.status < 400:
                    return page.html_content
                log.warning("HTTP %s for %s", getattr(page, "status", "?"), url)
            except Exception as exc:  # noqa: BLE001 - a dead site must not kill the run
                log.warning("fetch failed (%s/%s) %s: %s", attempt + 1, self.settings.retries + 1, url, exc)
            time.sleep(2 * (attempt + 1))
        return None

    def _browser_binary(self) -> Dict[str, str]:
        """Point Scrapling at a specific Chromium when one is configured.

        The Python API takes this as a keyword argument; only Scrapling's CLI and
        MCP server read SCRAPLING_EXECUTABLE_PATH from the environment.
        """
        path = self.settings.executable_path or os.environ.get("SCRAPLING_EXECUTABLE_PATH", "")
        return {"executable_path": path} if path else {}

    def _render(self, url: str, wait_selector: Optional[str]) -> Optional[str]:
        from scrapling.fetchers import StealthyFetcher

        for attempt in range(self.settings.retries + 1):
            try:
                page = StealthyFetcher.fetch(
                    url,
                    headless=self.settings.headless,
                    **self._browser_binary(),
                    network_idle=True,
                    timeout=self.settings.timeout_ms,
                    wait_selector=wait_selector,
                    solve_cloudflare=True,
                    google_search=True,
                    disable_resources=False,
                )
                if page is not None and page.status < 400:
                    return page.html_content
                log.warning("render HTTP %s for %s", getattr(page, "status", "?"), url)
            except Exception as exc:  # noqa: BLE001
                log.warning("render failed (%s/%s) %s: %s", attempt + 1, self.settings.retries + 1, url, exc)
            time.sleep(3 * (attempt + 1))
        return None
