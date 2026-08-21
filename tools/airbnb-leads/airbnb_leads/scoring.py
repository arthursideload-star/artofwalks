"""Score a lead against the ArtOfWalks ICP.

The product is a cheap (~EUR 50) cinematic walkthrough video built from photos a
host already has. The best prospect therefore:

  * manages holiday lets for other people, so one deal covers many listings;
  * sits in a European holiday region the showreel speaks to;
  * is small enough to have no in-house video team, big enough to have a budget;
  * is reachable, at a decision-making title, with a verified address.

Scores run 0-100. They rank a list - they are not a probability.
"""

from __future__ import annotations

from .models import Lead

MAX_SCORE = 100

_DECISION_TITLES = (
    "owner", "founder", "co-founder", "ceo", "managing director",
    "director", "partner", "head of", "chief",
)
_MARKETING_TITLES = ("marketing", "brand", "content", "revenue", "commercial")
_OPERATOR_TITLES = ("property manager", "general manager", "operations")

_STRONG_KEYWORDS = (
    "vacation rental", "short term rental", "short-term rental",
    "holiday rental", "holiday letting", "airbnb", "villa",
    "serviced apartment", "guest house", "property management",
)


def _employee_band_points(employees: str) -> tuple[int, str]:
    """Sweet spot is 2-50 people: no in-house video team, real budget."""
    digits = "".join(ch if ch.isdigit() else " " for ch in employees).split()
    if not digits:
        return 0, ""
    low = int(digits[0])
    if 2 <= low <= 50:
        return 15, "size 2-50 (no in-house video team, has budget)"
    if 51 <= low <= 200:
        return 10, "size 51-200 (may have in-house media)"
    if low <= 1:
        return 4, "solo operator (small budget)"
    return 3, "large org (long procurement)"


def score_lead(lead: Lead, region_weights: dict[str, float]) -> Lead:
    """Attach a 0-100 ICP score plus the reasons behind it."""
    points = 0
    reasons: list[str] = []

    # Region fit - up to 25.
    weight = region_weights.get(lead.country.strip().lower(), 0.0)
    if weight > 0:
        earned = int(round(25 * weight))
        points += earned
        reasons.append(f"{lead.country} target region (+{earned})")
    elif lead.country:
        points += 5
        reasons.append(f"{lead.country} outside core regions (+5)")

    # Vertical fit - up to 20.
    haystack = f"{lead.company} {lead.notes}".lower()
    hits = [k for k in _STRONG_KEYWORDS if k in haystack]
    if hits:
        earned = min(20, 8 + 4 * len(hits))
        points += earned
        reasons.append(f"vertical match: {', '.join(hits[:3])} (+{earned})")

    # Title fit - up to 20.
    title = lead.title.lower()
    if any(t in title for t in _DECISION_TITLES):
        points += 20
        reasons.append("decision maker (+20)")
    elif any(t in title for t in _MARKETING_TITLES):
        points += 16
        reasons.append("owns marketing budget (+16)")
    elif any(t in title for t in _OPERATOR_TITLES):
        points += 12
        reasons.append("operational buyer (+12)")
    elif title:
        points += 5
        reasons.append("non-buying title (+5)")

    # Company size - up to 15.
    earned, why = _employee_band_points(lead.employees)
    if earned:
        points += earned
        reasons.append(f"{why} (+{earned})")

    # Reachability - up to 20.
    if lead.is_verified:
        points += 14
        reasons.append("verified email (+14)")
    elif lead.has_usable_email:
        points += 8
        reasons.append("unverified email (+8)")
    if lead.website:
        points += 4
        reasons.append("has website (+4)")
    if lead.phone:
        points += 2
        reasons.append("has phone (+2)")

    lead.score = max(0, min(MAX_SCORE, points))
    lead.score_reasons = reasons
    return lead


def score_all(leads: list[Lead], region_weights: dict[str, float]) -> list[Lead]:
    return [score_lead(lead, region_weights) for lead in leads]


def band(score: int) -> str:
    if score >= 75:
        return "A - contact first"
    if score >= 55:
        return "B - solid fit"
    if score >= 35:
        return "C - worth a look"
    return "D - low priority"
