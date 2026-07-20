# Moving the site to artofwalks.com

The site currently lives at `https://arthursideload-star.github.io/artofwalks/`.
Follow these steps once you buy the domain. Total time: about 30 minutes plus
DNS waiting time.

## 1. Buy the domain

Any registrar works. Good options (roughly €10/year for a .com):

- **Cloudflare Registrar** — at-cost pricing, and you get free email
  forwarding (step 5) in the same dashboard. Recommended.
- Namecheap, Porkbun, INWX — also fine.

Avoid multi-year "premium" upsells; you only need the bare domain.

## 2. Set the DNS records

At your registrar / DNS provider, create these records:

| Type  | Name  | Value                                |
|-------|-------|--------------------------------------|
| A     | `@`   | `185.199.108.153`                    |
| A     | `@`   | `185.199.109.153`                    |
| A     | `@`   | `185.199.110.153`                    |
| A     | `@`   | `185.199.111.153`                    |
| CNAME | `www` | `arthursideload-star.github.io`      |

Notes:
- On Cloudflare, set these records to **DNS only** (grey cloud), at least
  until GitHub has verified the domain and issued the HTTPS certificate.
- The four A records are GitHub Pages' official addresses; all four should
  be present.

## 3. Connect the domain in GitHub

1. Open the repo on GitHub → **Settings → Pages**.
2. Under **Custom domain**, enter `artofwalks.com` and save.
   (GitHub commits a `CNAME` file to the repo automatically — that is
   expected, leave it in place.)
3. Wait until the DNS check next to the field turns green. This can take
   from a few minutes up to 24 hours.
4. Tick **Enforce HTTPS** as soon as the checkbox becomes available.

`www.artofwalks.com` will automatically redirect to `artofwalks.com`.

## 4. Update the URLs in the site files

The canonical/OG URLs and the sitemap still point at the github.io address.
After the domain is live, run this one-liner in the repo root:

```bash
grep -rl 'arthursideload-star.github.io/artofwalks' index.html sitemap.xml robots.txt README.md \
  | xargs sed -i 's|https://arthursideload-star.github.io/artofwalks/|https://artofwalks.com/|g'
```

Then commit and push. That updates:

- `index.html` — `<link rel="canonical">`, `og:url`, `og:image`, and the
  URL inside the JSON-LD structured data
- `sitemap.xml` — the `<loc>` entry
- `robots.txt` — the `Sitemap:` line
- `README.md` — the live-site link

The old github.io URL keeps redirecting to the new domain, so nothing breaks.

## 5. Professional email: hello@artofwalks.com

A branded address converts noticeably better than a Gmail address and is
required before doing any cold email outreach.

Free option A — **Cloudflare Email Routing** (if the DNS is on Cloudflare):
dashboard → Email → Email Routing → add `hello@artofwalks.com` and forward
it to your Gmail inbox. Cloudflare sets the MX records for you.

Free option B — **ImprovMX**: add the MX records they show you, forward
`hello@` to Gmail.

To also *send* as hello@artofwalks.com from Gmail: Gmail → Settings →
Accounts → "Send mail as" → add the address (both services document the
SMTP settings for this).

Afterwards, replace `frankarthur588@gmail.com` in `index.html` (contact
section) and `legal.html` (imprint + privacy) with the new address.

## 6. Verify

```bash
dig +short artofwalks.com          # should list the four 185.199.x.153 IPs
curl -sI https://artofwalks.com/ | head -5   # should return HTTP/2 200
```

Also open the site once on your phone (mobile network, not Wi-Fi) to
confirm HTTPS works everywhere.
