"""Apollo.io People Search + Bulk Enrich.

Requires a PAID Apollo plan: the search endpoint returns API_INACCESSIBLE on the
free tier. Authentication is an API key from Apollo > Settings > Integrations >
API, read from $APOLLO_API_KEY - never from the config file.

Credit model: search is free, revealing an email costs one credit per contact.
The run refuses to start if the reveal would exceed [apollo].max_credits.
"""

from __future__ import annotations

import os
import time
from typing import Any

from ..models import Lead
from .base import Provider, ProviderError

_SEARCH_PAGE_SIZE = 100     # Apollo's per-page maximum
_ENRICH_BATCH = 10          # bulk_match's per-request maximum


class ApolloProvider(Provider):
    @property
    def name(self) -> str:
        return "apollo"

    def describe(self) -> str:
        return "Apollo.io People Search + Bulk Enrich (licensed B2B data)"

    # -- plumbing ---------------------------------------------------------
    def _session(self):
        try:
            import requests
        except ImportError as exc:  # pragma: no cover - setup.sh installs this
            raise ProviderError("requests is not installed; run setup.sh") from exc

        key = os.environ.get("APOLLO_API_KEY", "").strip()
        if not key:
            raise ProviderError(
                "APOLLO_API_KEY is not set. Create a key at "
                "https://app.apollo.io/#/settings/integrations/api, then: "
                "export APOLLO_API_KEY=..."
            )
        session = requests.Session()
        session.headers.update({
            "X-Api-Key": key,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Accept": "application/json",
        })
        return session

    def _post(self, session, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.cfg['apollo']['base_url'].rstrip('/')}/{path.lstrip('/')}"
        response = session.post(url, json=payload, timeout=60)

        if response.status_code == 401:
            raise ProviderError("Apollo rejected the API key (401). Check APOLLO_API_KEY.")
        if response.status_code == 429:
            raise ProviderError("Apollo rate limit hit (429). Wait, then re-run.")

        try:
            body = response.json()
        except ValueError:
            raise ProviderError(
                f"Apollo returned non-JSON ({response.status_code}) for {path}"
            ) from None

        if body.get("error_code") == "API_INACCESSIBLE" or (
            response.status_code == 403 and "plan" in str(body.get("error", "")).lower()
        ):
            raise ProviderError(
                "Apollo's People Search API is not available on the free plan.\n"
                "  Options: upgrade the Apollo plan, or export a list from the "
                "Apollo web UI and re-run with --provider csv."
            )
        if not response.ok:
            raise ProviderError(
                f"Apollo {path} failed ({response.status_code}): "
                f"{body.get('error') or body}"
            )
        return body

    # -- search -----------------------------------------------------------
    def _search(self, session, target_count: int) -> list[dict[str, Any]]:
        icp = self.cfg.get("icp", {})
        countries = [r["country"] for r in icp.get("regions", []) if r.get("country")]

        people: list[dict[str, Any]] = []
        page = 1
        while len(people) < target_count:
            payload = {
                "person_titles": icp.get("titles", []),
                "person_seniorities": icp.get("seniorities", []),
                "q_organization_keyword_tags": icp.get("keywords", []),
                "organization_num_employees_ranges": icp.get("employee_ranges", []),
                "organization_locations": countries,
                "person_locations": countries,
                "page": page,
                "per_page": _SEARCH_PAGE_SIZE,
            }
            body = self._post(session, "mixed_people/search", payload)
            batch = body.get("people") or body.get("contacts") or []
            if not batch:
                break
            people.extend(batch)

            pagination = body.get("pagination") or {}
            if page >= int(pagination.get("total_pages") or page):
                break
            page += 1
            time.sleep(0.4)  # stay well inside the rate limit

        return people[:target_count]

    # -- enrich -----------------------------------------------------------
    def _enrich(self, session, people: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
        """id -> enriched record. Costs one credit per revealed email."""
        budget = int(self.cfg["apollo"].get("max_credits", 0))
        if len(people) > budget:
            raise ProviderError(
                f"Revealing {len(people)} emails would exceed the configured "
                f"budget of {budget} credits. Raise [apollo].max_credits or "
                f"lower --count."
            )

        enriched: dict[str, dict[str, Any]] = {}
        for start in range(0, len(people), _ENRICH_BATCH):
            chunk = people[start:start + _ENRICH_BATCH]
            payload = {
                "details": [{"id": p["id"]} for p in chunk if p.get("id")],
                "reveal_personal_emails": False,  # work addresses only
            }
            if not payload["details"]:
                continue
            body = self._post(session, "people/bulk_match", payload)
            for match in body.get("matches") or []:
                if match and match.get("id"):
                    enriched[match["id"]] = match
            print(f"    enriched {min(start + _ENRICH_BATCH, len(people))}/{len(people)}")
            time.sleep(0.4)
        return enriched

    # -- public -----------------------------------------------------------
    def fetch(self, target_count: int) -> list[Lead]:
        session = self._session()
        apollo_cfg = self.cfg["apollo"]

        print(f"  searching Apollo for up to {target_count} people...")
        people = self._search(session, target_count)
        print(f"  search returned {len(people)}")
        if not people:
            return []

        enriched: dict[str, dict[str, Any]] = {}
        if apollo_cfg.get("enrich_emails", True):
            print(f"  revealing emails ({len(people)} credits)...")
            enriched = self._enrich(session, people)

        leads: list[Lead] = []
        for person in people:
            record = enriched.get(person.get("id", ""), person)
            org = record.get("organization") or person.get("organization") or {}
            email = record.get("email") or ""
            status = (record.get("email_status") or "").lower()

            if apollo_cfg.get("require_verified_email") and status != "verified":
                continue

            leads.append(Lead(
                company=org.get("name", "") or record.get("organization_name", ""),
                contact_name=record.get("name")
                    or f"{record.get('first_name','')} {record.get('last_name','')}".strip(),
                title=record.get("title", ""),
                email=email,
                email_status=status,
                phone=record.get("sanitized_phone") or org.get("phone") or "",
                website=org.get("website_url", ""),
                city=record.get("city") or org.get("city") or "",
                country=record.get("country") or org.get("country") or "",
                employees=str(org.get("estimated_num_employees") or ""),
                source="apollo",
                source_url=record.get("linkedin_url", ""),
                notes=", ".join((org.get("keywords") or [])[:6]),
            ))
        return leads
