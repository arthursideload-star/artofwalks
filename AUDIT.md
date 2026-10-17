# ArtOfWalks site audit

Branch `claude/funny-knuth-budzy2`, 17 October 2026. Line numbers refer to the
branch as committed together with this file.

> **Do not merge this file to `main` as it is.** GitHub Pages publishes every
> file in the repository root (`.nojekyll` is set), so it would be readable at
> `artofwalks.com/AUDIT.md`, next to `SETUP.md` and `AD-VIDEO-PLAN.md`. It is a
> list of the site's legal weak spots. See finding 8.

## How this was checked

- Site served locally (`python3 -m http.server`), driven with Playwright
  Chromium at 390 × 844 and 1280 × 800: every section of `index.html`, plus
  `thanks.html`, `terms.html`, `legal.html` in full; console, failed requests,
  HTTP status of every asset, every in-page anchor, horizontal overflow, tab
  order.
- Lighthouse 12 (local, mobile and desktop presets).
- `ffprobe` and an atom-order check on the video, image dimensions with PIL,
  contrast ratios computed from the CSS colours.
- Git history for prices and for the removed media.

What could **not** be checked from here: the live site, `buy.stripe.com` and
Fontshare (the sandbox proxy blocks them), and real H.264 playback (Playwright's
Chromium has no H.264). Playback logic was tested with a VP9 copy of the film in
a throwaway copy of the site: the hero autoplays and the pause and play buttons
work at both widths.

Results: no JavaScript errors, no 404s, no dead anchors, no horizontal scroll at
390 px. The only console error is the blocked Fontshare stylesheet (sandbox).
Lighthouse, local and therefore without gzip, CDN or the font:

| Preset  | Performance | Accessibility | Best practices | SEO | LCP   | CLS |
| ------- | ----------- | ------------- | -------------- | --- | ----- | --- |
| Mobile  | 97          | 100           | 96             | 100 | 1.7 s | 0   |
| Desktop | 100         | 100           | 96             | 100 | 0.4 s | 0   |

The scores flatter the page: Lighthouse's Chromium could not decode the 4.7 MB
hero film, so it never downloaded it (see finding 13).

## Already fixed on this branch (part A)

- All Santorini / Iceland material is gone from the working tree: files,
  markup, captions, alt texts, nav links, JSON-LD / og / preload references,
  before/after CSS and JS, README and SETUP text. A grep for `video-1`,
  `video-2`, `poster-1`, `poster-2`, `photo-1`, `photo-2`, `Santorini`,
  `Iceland`, `caldera` finds nothing.
- `video-3.mp4` is labelled "AI-generated sample film" in the hero (new) and
  under Examples (caption and play button label).
- The 14-day money-back guarantee is gone from the meta description, both
  trust lists, the guarantee section, the FAQ and its JSON-LD, the thanks page
  and terms clause 9 (clauses renumbered). The free-sample offer that lived in
  the guarantee section stays as its own block. The withdrawal text and model
  form are unchanged except for the one sentence that pointed to clause 9.
- `SETUP.md` section 5 now says the withdrawal wording needs a lawyer, the IHK
  or a trader association, and that orders placed under the guarantee keep it.

## Findings

Severity: **High** = legal exposure, money at risk, or the offer is misleading.
**Medium** = real cost in conversion, performance, privacy or accessibility.
**Low** = polish and hygiene.

| # | Sev | Where | Issue and why it matters | Proposed fix | Needs my decision |
|---|-----|-------|--------------------------|--------------|-------------------|
| 1 | High | `main`, 11 other remote branches, git history | The unlicensed Santorini/Iceland files are still on `main`, so they are still **live on artofwalks.com** until this branch is merged. 11 other `claude/*` branches still contain them. The repository is public, so all of them can also be downloaded from history (commits `353d49d`…`7646317`). | Merge this branch soon. Delete the stale branches. If a rights holder complains, a history rewrite (`git filter-repo`) plus a GitHub Support request to purge cached views is the only way to remove them from GitHub. That was deliberately not done here. | **Yes**: merge timing, branch deletion, history rewrite |
| 2 | High | `index.html:278`, `:321`, `:324`; `js/main.js:243-260` | **Made-up reference price.** The Full Walkthrough shows "Summer Sale · −25%" and a struck-through €999. €999 was never charged: the price was €799 on 17 July and has been €749 since 19 July (git history). The sale ended on 15 September; the script hides the sale line but the badge and struck price stay. § 11 PAngV requires the lowest price of the previous 30 days as the reference for any price cut (that is €749), and an invented "was" price is misleading under § 5 UWG. This is a classic target for warning letters. | Show €749 plainly. Remove the badge, the `<s>` price, the sale line and the countdown script. Update `SETUP.md` section 3. Any future sale must be calculated from the real 30-day low. | **Yes**: drop the sale or run a real one |
| 3 | High | `index.html:7`, `:10`, `:184`, `:217`, `:288/302/315/333`, `:395`, `:492`; `thanks.html:45`; `terms.html:58`, `:88` | **Delivery time is stated five different ways.** Hero, buy bar and meta: "Delivered in 3 days". Step 3: "3 to 7 days". Cards, FAQ and terms: 3/5/7/5 *business* days from photo receipt. The withdrawal section adds that production waits until the 14-day withdrawal period is over unless the customer asks to start early, so a buyer who doesn't ask waits 14 days plus up to 7 business days. A headline promise that only holds for one package, and only if the customer asks for an early start, is misleading (§ 5 UWG). It also contradicts "no waiting weeks" (`:174`) and "Ready in Days, Not Weeks" (`:262`). | Use one formula everywhere: "Single clips in 3 business days, packs and walkthroughs in 5–7, counted from when your photos arrive." Collect the early-start request at checkout (finding 4) so the default is the fast path. | **Yes**: the wording, and whether early start becomes the default |
| 4 | High | Stripe checkout; `terms.html:47`, `:86-88`; `thanks.html` | **Withdrawal information and consent may not reach the buyer.** With Payment Links, the buyer pays without seeing or accepting the terms or the withdrawal policy, unless "require terms of service acceptance" is switched on in Stripe (not verifiable from here). The early-start consent and acknowledgement are collected later, by email (`:88`). No order confirmation on a durable medium carries the terms, the withdrawal policy and the model form (Stripe's receipt doesn't). If the withdrawal information is missing, the withdrawal period extends to 12 months + 14 days (§ 356 (3) BGB), and a consumer who withdraws may owe nothing for finished work. Without the guarantee, this is now the main financial risk. | In each Payment Link: require ToS acceptance (link to `terms.html`), add a custom checkbox or text for "start immediately, I know my right of withdrawal ends on completion", and turn on invoice creation. Send every buyer an order-confirmation email template containing the terms, the withdrawal policy, the model form and a confirmation of the early-start consent (§ 312f BGB). Have a lawyer check it (`SETUP.md` section 5). | **Yes**: lawyer, Stripe settings |
| 5 | High | `terms.html:74-101` | **Withdrawal wording itself** (listed only, because part A says not to touch it). It is written for *services* (§ 356 (4) BGB). A video delivered as a file may count as *digital content* (§ 356 (5) BGB), where the wording differs. If it is a service, the official model text also has a paragraph on compensation for work done after an early start, and that paragraph is missing. The model form (`:94`) speaks of "the provision of the following service". | Lawyer, IHK Potsdam or Händlerbund to confirm the category and supply the matching official text (already in `SETUP.md`). | **Yes**: lawyer |
| 6 | High | `index.html:23-25`; same in `thanks.html:14-16`, `terms.html:20-22`, `legal.html:14-16`; `legal.html:59` | **Fonts loaded from Fontshare on every page view.** The visitor's IP goes to a third party without consent. LG München I (20.01.2022, 3 O 17493/20) found the same pattern with Google Fonts unlawful, and a wave of warning letters followed. The privacy policy names Fontshare but gives no legal basis and no third-country transfer basis. It is also the only render-blocking third-party request (CSS that then loads the font, about 0.3–0.8 s on mobile per Lighthouse). | Self-host Satoshi: download 2–3 weights (400, 700, 900) as woff2 from fontshare.com (check the ITF Free Font License allows self-hosting), add `@font-face` to `styles.css`, preload the main weight, remove the three external lines from all four pages, rewrite the "Web fonts" privacy paragraph. With fonts self-hosted the site sets no cookies and loads nothing from third parties, so no consent banner is needed. | No |
| 7 | High | `legal.html:64-65`; `index.html:199-221` (how it works); `AD-VIDEO-PLAN.md:21` | **AI processing of customer photos is not disclosed.** The privacy policy says photos are processed "solely to … produce your order". The ad plan names Kling (Kuaishou, China), the sample film was finished in Clipchamp (Microsoft; its tag is in the file), and photos arrive through Gmail, WeTransfer or Google Drive. None of these processors or third-country transfers is named. The landing page never says that videos are made with AI, which is material information for a host (§ 5a UWG). AI video can invent details the property doesn't have (furniture, views, pools), and a host who posts that misrepresents the listing. | Say it openly in How it Works and the FAQ: "We animate your photos with AI video tools and check every clip against your photos for invented details." Name each processor and its transfer basis in the privacy policy. Give hosts a ready-made "AI-animated from real photos" caption for their posts. | **Yes**: which tools you use, final wording |
| 8 | High | Repo root: `AUDIT.md`, `AD-VIDEO-PLAN.md`, `SETUP.md`, `README.md`, `.claude/settings.json` | **Internal notes are published by Pages.** With `.nojekyll` and the site served from the repo root, every file is public: `SETUP.md` and `README.md` already are on `main` (not checked live: sandbox). `AD-VIDEO-PLAN.md` and this file would follow on merge. They spell out unverified claims and legal gaps. | Move the site into `site/` (or `docs/`) and point Pages at that folder, or keep notes in the private `artofwalks-os` repo. At the very least, don't merge `AUDIT.md` and `AD-VIDEO-PLAN.md` to `main`. | **Yes**: where internal docs live |
| 9 | High | `index.html:347`; `terms.html:50`; `SETUP.md` section 2 | **No VAT statement.** "All prices are total prices" doesn't say whether VAT is included. For distance selling, § 6 PAngV requires saying so; for a Kleinunternehmer the usual line is "No VAT is charged under § 19 UStG". Hosts who buy as businesses also need a proper invoice. Open since August. | Add the one correct sentence in both places once the tax status is known. Turn on Stripe invoices. | **Yes**: your VAT status |
| 10 | High (verify) | `index.html:217`, `:334`, `:431`, JSON-LD `:105`; `thanks.html:49` | **"Ready to upload to Airbnb / Booking.com / VRBO."** I could not verify offline whether these platforms currently let hosts add a video to a listing. Airbnb listing galleries have long been photo-only. If that is still true, the headline use case is not available: misleading, and the first thing a host will find out. | Check each platform's host help pages. If video isn't supported, reword the use case: Instagram/TikTok/Reels, the host's own booking site, messages to guests, and the listing's first photo as a still from the film. | **Yes**: confirm platform support |
| 11 | Medium | `thanks.html:59`; `css/styles.css:967` | The "Back to the site" button on the thanks page is orange text on orange (1.24:1, effectively invisible). `.legal-main a` overrides the button's `.btn-solid` colour. This is the first page every buyer sees. | `.legal-main a:not(.btn) { … }` or `.legal-main .btn-solid { color: var(--bg); }` | No |
| 12 | Medium | `index.html:105`, `:431`; `terms.html:64-65` | **"You own the video"** contradicts the terms: the buyer gets a *non-exclusive* right of use and ArtOfWalks may show the video as a reference. Purely AI-generated output may not be protected by copyright at all. | FAQ and JSON-LD: "You get a permanent, worldwide right to use the video anywhere, including commercially." | No (unless you want to grant exclusive rights) |
| 13 | Medium | `js/main.js:70-74`, `:143`; `index.html:162`; `assets/videos/video-3.mp4` | **Every visitor downloads the 4.7 MB hero film**, phones included: `show(0)` calls `video.load()`, which overrides `preload="none"` (confirmed: request plus autoplay within 3 s at 390 px). The film is 1920×1080, H.264 High@4.0, 3.1 Mbit/s, 12.7 s, faststart OK, no audio. | Encode a 720p variant at about 1.5 Mbit/s (about 2.3 MB) and pick the source in JS by viewport width and `navigator.connection.saveData`. Load the hero film after the `load` event. | No |
| 14 | Medium | `index.html:285-334`, `:431`; `terms.html:64` | **Music promises**: every card promises music ("Licensed background music", "won't run into copyright claims"), but the only sample is silent. You need a licence that lets *clients* use the track commercially on social platforms (Content ID). Many stock licences don't cover sublicensing. "Won't run into copyright claims" is a guarantee you don't control. | Name the source internally and check its licence covers client use; soften to "music licensed for use on social media and your website". | **Yes**: music source |
| 15 | Medium | `index.html:293` | **"Most popular"** on the 5 Clip Pack. If that isn't based on actual sales, it is an unproven claim (§ 5 UWG). | Use "Best value" (provable: €40 per clip) or drop the badge. | **Yes** |
| 16 | Medium | `legal.html:49-68` | **Privacy policy gaps** beyond findings 6 and 7: no explicit controller block, no legal basis or retention period for GitHub's server logs or Cloudflare, no third-country transfer basis (EU-US Data Privacy Framework) for GitHub, Cloudflare and Stripe US, no mention of Gmail, WeTransfer or Google Drive (suggested in `index.html:386` and `thanks.html:40`), no separate Art. 21 objection notice. | Extend those sections. A generator such as e-recht24 or the Datenschutz-Generator by Dr. Schwenke covers this for a static site. | No (only the list of tools you use) |
| 17 | Medium | Stripe Payment Links | **Payments not verifiable offline.** The HTML mapping is consistent: Single → `…g400` (€50), 5-pack → `…g401` (€200), 10-pack → `…g403` (€399), Full → `…g402` (€749), matching each button's `data-price`. Product name, amount, success URL (`thanks.html`), email collection, ToS consent, invoices, and whether Apple Pay / Google Pay are switched on (promised at `index.html:207`, `:413`) all need checking in the Stripe dashboard. | Click each button once (`SETUP.md` section 1) and tick off the settings above. | No |
| 18 | Medium | `index.html:223-245` | **Conversion: no proof.** The only example is an AI-generated 13-second film that wasn't made from a host's listing photos, while the headline product is a 1–2 minute walkthrough made from *your* photos. A host can't see the transformation they are paying for. | Make 2–3 before/after pairs from photos you own or that are CC0 (e.g. your own flat, a friend's listing with written permission): input photos next to the output. Add one full-length walkthrough. Never use photos copied from Airbnb or Booking. | **Yes**: which material |
| 19 | Medium | Whole page | **Conversion: no trust signals.** No name or face behind the business, no reviews, a Gmail address, the guarantee now gone. "Why Hosts Love ArtOfWalks" (`:251`) implies happy customers the page can't show. | Short "Who makes your video" block with your name and photo. Domain email (Cloudflare Email Routing is free). Real testimonials as they come in, never invented. Rename to "Why Hosts Choose ArtOfWalks" until there are reviews. | **Yes** |
| 20 | Medium | `index.html:280-334` | **Conversion: unclear deliverable.** Missing: aspect ratio (9:16 or 16:9, or both?), resolution, how many photos per clip, what goes in a clip, whether clip packs include any revision, what happens if the photos are unusable. Hosts pay before anyone looks at their photos. | Add a one-line spec under each card and an FAQ "What if my photos aren't good enough?". Move the free-sample CTA up, next to the pricing headline or into the hero. | **Yes** |
| 21 | Medium | `index.html:352-364` | **The free sample has no limits.** It is unlimited, has no terms, and each one costs you AI credits and time. Kept as it was (it sat inside the removed guarantee section). | Decide whether it stays. If it does: one per listing, delivered within X days, sample may carry a watermark. | **Yes** |
| 22 | Low | `index.html:14`, `:16`, `:44`; `css/styles.css` `.contact-backdrop` | The share image (og:image), the JSON-LD image and the contact-section backdrop are frames of the AI film without an AI label. `og:image:height` says 853, but the file is 1280×720. | Make a branded share card (logo + headline, 1200×630) and use it for og:image and JSON-LD. Fix the height. | No |
| 23 | Low | `index.html:26`; `css/styles.css:246-257` | `poster-3.jpg` (96 KB) is preloaded, but the hero shows only the CSS gradient until the film's first frame decodes. The preload competes with the CSS on mobile, and Lighthouse picks the wordmark as LCP. | Show the poster in the hero until the video is ready, or drop the preload. Serve the poster as WebP (about 45 KB). | No |
| 24 | Low | `css/styles.css:567`; `js/main.js:182-191` | After the play button is pressed it becomes invisible (`opacity: 0`) but keeps keyboard focus, so a keyboard user sees no focus ring and has to hunt for the native controls. | After activation, `video.focus()` and set `playBtn.hidden = true`. | No |
| 25 | Low | `index.html:158-196`, `:228-241` | The video is video-only (no audio), so captions aren't needed, but there is no short text description of what it shows (WCAG 1.2.1). There is no skip link. | Add a one-sentence description under the Examples film; add a "Skip to content" link. | No |
| 26 | Low | `index.html:228` | "Click to watch it full size": clicking plays it inline with controls; it doesn't go full size. | "Click to play." or call `requestFullscreen()` on click. | No |
| 27 | Low | `index.html:241` | "Spain Coast" as the title of an AI-generated film reads like a real place or property. | "Coastal villa · AI-generated sample film". | **Yes** (name) |
| 28 | Low | `index.html:413` | "The same payment provider used by companies like Shopify and Booking.com": third-party brand names you can't easily back up. | "Checkout runs on Stripe, one of the largest payment providers worldwide." | No |
| 29 | Low | `index.html:395`, `:468` | "Rush delivery is available on request" has no price or terms; "We answer within 24 hours" is a promise you have to keep on weekends too. | Give rush a price (or drop it); "We usually answer within one business day." | **Yes** (rush price) |
| 30 | Low | `index.html:6`, `:479` | "Airbnb" in the title and footer is descriptive use and generally fine, but nothing says ArtOfWalks is independent of Airbnb. | Footer line: "ArtOfWalks is independent and not affiliated with Airbnb, Booking.com or VRBO." | No |
| 31 | Low | `index.html:80-107` | FAQ JSON-LD doesn't match the visible FAQ (5 vs 8 questions, different wording). Google shows FAQ rich results only for government and health sites since 2023, so it brings nothing. | Remove the FAQPage block, or keep it in sync with the visible text. | No |
| 32 | Low | `sitemap.xml:5` | `lastmod` 2026-08-23 is stale. Otherwise valid; `robots.txt` is valid. | Set it when the site changes. | No |
| 33 | Low | `legal.html:35-42` | The Impressum is complete for a sole trader (name, address, phone, email; § 18 MStV line optional). It publishes your private mobile number and home address. No VAT ID listed (only required if you have one). | Optional: separate business number; add USt-IdNr. once issued. | **Yes** |
| 34 | Low | `terms.html:2-7` | The page source says "DRAFT — reviewed by no lawyer". | Remove after the lawyer check. | No |
| 35 | Low | `.claude/settings.json` | Enables two third-party Claude Code plugins (`JuliusBrussee/caveman`, `heygen-com/hyperframes`) and an env var for every session on this repo, and on this branch the file sits in the Pages root (served if Pages serves dot-folders; not verifiable here). | Keep it in user settings instead of the repo, or move the site into a subfolder (finding 8). | **Yes** |
| 36 | Low | `js/main.js:107-109`, `:229-241`, `data-playable="preview"` path; `css/styles.css` `.dots/.dot/.dot-fill`, `.work-a/.work-c` + bento grid, `.footer-legal`; `index.html:117-118` | Dead code after the media removal: carousel dots and arrows, the `REPLACE_` checkout fallback (all four links are real now), the preview mode, unused CSS (~10 KB per Lighthouse), unused caret icons. Harmless, but it confuses the next edit. | Remove, unless more hero films are planned. | No (unless more hero films are planned) |
| 37 | Low | `assets/videos/video-3.mp4` | Metadata tag "Create videos with https://clipchamp.com …". | `ffmpeg -i in.mp4 -map_metadata -1 -c copy out.mp4` | No |
| 38 | Low | `README.md:9-10` | Still says the Stripe links are placeholders. | Update. | No |
| 39 | Low | `css/styles.css` 760 px block | On phones the footer text is centred but the link row is left-aligned. No custom `404.html`. | `justify-content: center` on `.footer-links`; add a branded 404 page. | No |
| 40 | Low | Whole site | Copy is consistently English, including the legal pages, with no typos found. German law and a German operator, but no German version. | Optional German version for DACH hosts. | **Yes** |

### Checked and fine

Heading structure (one H1, logical H2/H3), visible focus ring everywhere,
keyboard order, `prefers-reduced-motion` (no autoplay, no reveal animations),
pause control for the autoplaying hero, colour contrast of body text (muted
text 6.7–7.7:1, buttons 6.4:1), mobile menu with Escape, `rel="noopener"` on
every `target="_blank"` link, no third-party scripts, no cookies set by the site
itself, canonical, title, meta description, valid JSON-LD (Organization,
WebSite, Service, FAQPage), `robots.txt`, `sitemap.xml`, layout shift 0, video
`faststart` in place, no layout break at 390 px or 1280 px.

## Questions for you

1. When can this branch go to `main`? Until then the unlicensed media is still
   on artofwalks.com. And may the stale `claude/*` branches be deleted?
2. Pricing: drop the "sale" and show €749 plainly, or run a real, dated sale
   calculated from €749?
3. Delivery: which single sentence is true for all packages, and should "start
   immediately" become the default at checkout?
4. VAT: Kleinunternehmer (§ 19 UStG) or regular VAT?
5. Which AI and editing tools touch customer photos (Kling, Clipchamp,
   others)? They have to be named in the privacy policy, and I'd say on the
   page that videos are AI-animated.
6. Have you confirmed that Airbnb, Booking.com and VRBO accept video on a
   listing today?
7. Where does the music come from, and does its licence cover your clients'
   commercial use?
8. Keep the free sample offer? With which limits?
9. Is "Most popular" on the 5 Clip Pack based on sales?
10. Should internal docs (this file, `SETUP.md`, `AD-VIDEO-PLAN.md`) move out
    of the published root before the next merge?
