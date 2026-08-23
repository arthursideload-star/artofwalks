# Things you have to fill in yourself

Two of these are placeholders right now. The site works either way — but until
you replace them, buy buttons open an email instead of a checkout.

## 1. The four Stripe payment links

In Stripe: **Payment links → New**. Create one link per package.

| Package          | Price | Success URL                            |
| ---------------- | ----- | -------------------------------------- |
| Single Clip      | €50   | `https://artofwalks.com/thanks.html`   |
| 5 Clip Pack      | €200  | `https://artofwalks.com/thanks.html`   |
| 10 Clip Pack     | €399  | `https://artofwalks.com/thanks.html`   |
| Full Walkthrough | €749  | `https://artofwalks.com/thanks.html`   |

Two settings worth turning on for every link:

- **Collect customer email** — you need it to send the video.
- **Custom field: "Listing name or address"** — saves one email round trip.

Then swap the placeholders in `index.html`:

```
https://buy.stripe.com/REPLACE_SINGLE_CLIP       -> your Single Clip link
https://buy.stripe.com/REPLACE_5_CLIP_PACK       -> your 5 Clip Pack link
https://buy.stripe.com/REPLACE_10_CLIP_PACK      -> your 10 Clip Pack link
https://buy.stripe.com/REPLACE_FULL_WALKTHROUGH  -> your Full Walkthrough link
```

Until you do, `js/main.js` quietly rewrites those buttons into an email order
to `artofwalks@gmail.com`, so nobody ever hits a dead link.

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
