# Cloudflare deployment guide

How f8th.io deploys. The site is a static Astro build served by a **Cloudflare
Workers Static Assets** Worker (not Cloudflare Pages — an assets-only Worker is
the current recommended path for purely static sites, and it's what
`wrangler.jsonc` in this repo is configured for).

Everything in section 1 needs the owner's terminal + browser; the dashboard
sections separate "what to click" decisions that were deliberately NOT
automated (no Terraform on purpose).

## 1. First deploy — one-time, from your terminal

The deploy command ships `dist/` — so always build through npm, never with
`npx astro build` directly (the `postbuild` step hashes the theme script into
the CSP; see `AGENTS.md`).

```sh
npm run build          # builds dist/ and regenerates dist/_headers
npx wrangler login     # opens a browser; approve the OAuth prompt
npx wrangler whoami    # sanity check: your account appears
npx wrangler deploy    # uploads dist/ per wrangler.jsonc
```

After the deploy, wrangler prints a preview URL — a **temporary first
verification step before the real domain**:

```sh
curl -sI https://f8th-io.<your-subdomain>.workers.dev/ | grep -iE 'content-security|strict-transport|x-frame'
curl -s  https://f8th-io.<your-subdomain>.workers.dev/nope/       # expect the 404 page
curl -sI https://f8th-io.<your-subdomain>.workers.dev/index       # expect 307 -> /
```

Points of verification: security headers present, 404 page served with a 404
status (`not_found_handling: "404-page"` in `wrangler.jsonc`), trailing-slash
redirect from `/index` to `/` (`auto-trailing-slash`, matching
`astro.config.mjs → trailingSlash: "always"`).

## 2. The zone — f8th.io DNS

The domain registrar is Spaceship; Cloudflare only serves DNS after zone
activation.

1. Dashboard → **Add a domain** → `f8th.io` → plan **Free**.
2. Cloudflare assigns two generic nameservers (e.g. `marlowe.ns.cloudflare.com`).
3. At Spaceship: replace the registrar nameservers with the two Cloudflare ones.
   Activation is usually minutes, up to ~24 h worst case.
4. When Cloudflare activates the zone, import/verify the DNS records it could
   see before the takeover.

## 3. Custom domain on the Worker

Workers dashboard → **f8th-io** → Settings → **Domains & Routes** → **Add** →
Custom domain → `f8th.io`.

- Cloudflare creates the DNS record for the apex automatically. No CNAME to a
  pseudo-host is needed (that's a Pages/pre-Workers-pattern thing we skipped).
- The worker becomes reachable at `https://f8th.io` natively (no route config
  to maintain).
- `www.f8th.io` (redirect, next section) needs its own decision here too: add
  the custom domain `www.f8th.io` to the same worker so DNS for it exists as
  well; it also lands on the worker, which is harmless because rule 4 in the
  next section turns every traversing `www` hit into a redirect.

## 4. `www` redirect

Dashboard → **Rules** → **Redirect Rules** → create a **Single Redirect**:

- If: hostname equals `www.f8th.io`
- Then: dynamic redirect, expression `(http.request.full_uri)` →
  `concat("https://f8th.io", substring(http.request.uri.path, 0), http.request.uri.query)`
  (or, simpler and equivalent: URL rewrite with the preset "Redirect from
  `www.f8th.io` to `f8th.io`" — keep either, not both).

Effect: `https://www.f8th.io/anything` → `https://f8th.io/anything` with a
301. Apex always wins (SEO prefers one canonical host).

## 5. DNSSEC

One toggle **from both sides**:

1. Cloudflare: zone → DNS → **Enable DNSSEC** — it shows the **DS record**.
2. Spaceship: domain management → DNSSEC → add the DS record exactly as shown
   (Key tag, Algorithm = "ECDSA P-256 SHA-256 (13)", digest type + digest).

Verification: `dig DNSKEY f8th.io +short` and
`https://dnssec-debugger.verisignlabs.com/f8th.io` — should reach "successful
validation" with no parent/child mismatch.

## 6. Continuous deploys — Workers Builds (git)

After the manual deploy works, switch to "push to `main` = deploy":

1. Workers dashboard → **f8th-io** → Settings → **Builds** → **Connect git**:
   the `n0ct1s-k8sh/f8th.io` GitHub repo, branch `main`.
2. Build command `npm run build`; output directory handled by wrangler config
   (dist/) — review the pipeline settings vs `wrangler.jsonc` (they must match:
   the Worker definition lives in the repo, the dashboard build only feeds it).
3. **Build environment** variables (only one needed):
   - `NODE_VERSION` = `26` (so the runner matches `.nvmrc`/`engines`).
4. Webhook wiring is automatic; from then on, `wrangler deploy` from a terminal
   is the *manual* fallback, not the routine.

Branch protection on GitHub (`main`) + CI is Phase 4 — the deploy itself is
what this section covers.

## 7. Verify the real domain

```sh
curl -sI https://f8th.io/ | head -20                          # status, headers
curl -sI https://f8th.io/ | grep -i content-security-policy   # hash-CSP intact
curl -s  https://f8th.io/nope/  -o /dev/null -w '%{http_code}\n'   # 404
curl -sI https://www.f8th.io/ | head -3                       # 301, Location: https://f8th.io/
```

Also test in a browser: theme switching (System/Light/Dark), and the 404 page.
If any header is missing, `dist/_headers` was probably not regenerated — that
means the deploy used `npx astro build` instead of `npm run build`.
