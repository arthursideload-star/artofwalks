# Things still on your plate

## 1. Test the four buy buttons once

The real Stripe payment links are in place. Nobody has clicked them yet, and
the link ids were created out of order (`...400`, `...401`, `...403`, `...402`),
so a mix-up between the 10 Clip Pack and the Full Walkthrough would not be
obvious from the URLs alone. **Click each of the four buttons once** and check
that the Stripe page shows the right package name and amount:

| Button           | Should show |
| ---------------- | ----------- |
| Single Clip      | €50         |
| 5 Clip Pack      | €200        |
| 10 Clip Pack     | €399        |
| Full Walkthrough | €749        |

Two settings worth turning on for every link in Stripe, if they are not already:

- **Collect customer email** — you need it to send the video.
- **Custom field: "Listing name or address"** — saves one email round trip.

Also confirm each link's success URL points at `https://artofwalks.com/thanks.html`.

## 2. Add the VAT line

`index.html` (under the pricing table) and `terms.html` (clause 4) currently
carry wording that is true either way:

> All prices are total prices in euro. What you see is what you pay.

That is deliberately neutral, because a wrong tax statement on a page that
takes money is a real problem. Once you know which case you are in, add the
matching sentence to **both** places:

- **Kleinunternehmer (§ 19 UStG)** — the usual case for a new one-person
  business: *"No VAT is charged under the small business rule (§ 19 UStG)."*
- **Regelbesteuerung** — if you charge VAT: *"All prices include 19% VAT."*

If you don't know which applies to you, your tax advisor or your Finanzamt
registration (Fragebogen zur steuerlichen Erfassung) will say.

## 3. The sale end date

In `index.html`, the pricing headline carries:

```html
<p class="pricing-sale" data-sale-end="2026-09-15">
```

Change that date and the countdown follows automatically. When the date passes,
the whole sale line hides itself — but the Full Walkthrough card still shows the
struck-through €999 and the "Summer Sale · −25%" badge, so either extend the
date or edit that card too.

## 4. Google Search Console

The sitemap entry has to be the sitemap file, not the homepage. Submitting
`https://artofwalks.com/` gets rejected with "Sitemap ist HTML" — that URL is
the landing page. The correct one is:

```
https://artofwalks.com/sitemap.xml
```

Remove the wrong entry (three dots on its row -> "Sitemap entfernen"), then add
`sitemap.xml` under "Neue Sitemap hinzufügen".

After that, go to **URL-Prüfung**, paste `https://artofwalks.com/`, and click
**Indexierung beantragen**. That is the fastest way to get a new site into the
index; the sitemap alone can take days.

Being found for "art of walks" rather than the exact URL also needs signals
from outside the site. The markup now tells Google that "Art of Walks" and
"ArtOfWalks" are the same name, but a domain nobody links to stays invisible.
The free things that actually move this:

- Social profiles named ArtOfWalks (Instagram, TikTok, YouTube) with
  artofwalks.com in the bio. Once they exist, add their URLs to the `sameAs`
  array in the Organization block in `index.html`.
- A Google Business Profile (Unternehmensprofil) for the business.
- Any real mention of the brand on a site Google already crawls.

## 5. Have the legal texts read once

`terms.html` (terms + right of withdrawal) and the Stripe section in
`legal.html` are solid boilerplate written to match how you actually sell, but
no lawyer has seen them. Selling to consumers in the EU is the point where that
starts to matter. One hour with a lawyer is cheap compared to one warning letter.

## Updating content

- Videos: replace `assets/videos/video-1..3.mp4` (keep the names).
- Posters: `assets/posters/poster-1..3.jpg`, one frame out of each video.
- Before/after photos: `assets/photos/photo-1..2.jpg`.
- Texts, prices, labels: edit `index.html`.

Static site, no build step. Push to `main` and GitHub Pages redeploys.
