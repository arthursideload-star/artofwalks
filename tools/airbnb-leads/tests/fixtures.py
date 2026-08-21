"""Synthetic pages shaped like the real ones, so parsing is testable offline."""

import json


def airbnb_listing_html(
    listing_id: str = "53564686",
    photos: int = 32,
    bedrooms: int = 6,
    capacity: int = 12,
    rating: float = 4.92,
    reviews: int = 148,
    description: str = "Villa Aurora. Book direct at https://villa-aurora-mallorca.example or @villaaurora",
) -> str:
    """A listing page with the state Airbnb embeds as JSON plus a photo gallery."""
    gallery = "".join(
        f'<img src="https://a0.muscache.com/im/pictures/miso/Hosting-{listing_id}/original/'
        f'photo-{i:04d}-abcdef123456.jpeg?im_w=1440" />'
        for i in range(photos)
    )
    state = {
        "niobeMinimalClientData": [
            [
                "StaysPdpSections",
                {
                    "data": {
                        "presentation": {
                            "stayProductDetailPage": {
                                "sections": {
                                    "metadata": {
                                        "loggingContext": {
                                            "eventDataLogging": {
                                                "listingId": listing_id,
                                                "personCapacity": capacity,
                                                "bedrooms": bedrooms,
                                                "beds": bedrooms + 2,
                                                "bathrooms": 4,
                                                "starRating": rating,
                                                "visibleReviewCount": reviews,
                                                "roomTypeCategory": "entire_home",
                                            }
                                        }
                                    },
                                    "listingTitle": "Villa Aurora — Sea View Estate",
                                    "city": "Pollenca",
                                    "country": "Spain",
                                    "hostName": "Marta",
                                    "hostId": "998877",
                                    "isSuperhost": True,
                                    "listingsCount": 14,
                                    "htmlDescription": {"htmlText": description},
                                }
                            }
                        }
                    }
                },
            ]
        ]
    }
    return f"""<!doctype html><html><head><title>Villa Aurora</title></head><body>
<div data-section-id="TITLE_DEFAULT"><h1>Villa Aurora — Sea View Estate</h1></div>
<div>{bedrooms} bedrooms · {capacity} guests · {bedrooms + 2} beds</div>
{gallery}
<script id="data-deferred-state-0" type="application/json">{json.dumps(state)}</script>
</body></html>"""


def airbnb_search_html(ids=("11111111", "22222222", "33333333")) -> str:
    cards = "".join(
        f'<div data-testid="card-container"><a href="/rooms/{i}?adults=8">Villa {i}</a></div>' for i in ids
    )
    return f"<!doctype html><html><body>{cards}</body></html>"


HOST_SITE_HTML = """<!doctype html><html><body>
  <header><a href="/kontakt">Kontakt</a></header>
  <h1>Villa Aurora Mallorca</h1>
  <p>Direktbuchung und Fragen gerne jederzeit.</p>
</body></html>"""

HOST_CONTACT_HTML = """<!doctype html><html><body>
  <h1>Kontakt</h1>
  <p>Telefon: <a href="tel:+34 971 530 123">+34 971 530 123</a></p>
  <p>E-Mail: <a href="mailto:hola@villa-aurora-mallorca.example">hola@villa-aurora-mallorca.example</a></p>
</body></html>"""
