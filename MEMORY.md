# MEMORY.md — f8th.io project memory

*Working notes for the agent — committed to git on purpose (owner's
instruction, 2026-11-04; updates append on every session).*

---

## Project

Personal site of **Fran T. Olivo** (SRE & Platform Engineer) at **https://f8th.io**.
Learning vehicle: owner is new to JS/TS ecosystem; prefer minimal, explicit, commented code.
Budget: €0 hosting (domain renewal only).

## Decisions (agreed)

- **Stack:** Astro 7.4 (minimal template, no theme), strict TS, plain CSS, Markdown content later.
- **Hosting:** Cloudflare **Workers Static Assets** (NOT Pages — deprecated-ish). Free.
- **No Terraform** — discarded. All Cloudflare config done manually in the dashboard +
  documented in `docs/cloudflare.md` (planned).
- **Repo:** public `github.com/n0ct1s-k8sh/f8th.io`, default branch `main`, commit directly to
  main until CI + previews exist (then PRs).
- **Language:** English only.
- **Brand:** `SITE_TITLE = "f8th.io"` (header, `<title>`, og:title); `AUTHOR = "Fran T. Olivo"`
  (About h1, footer, meta author). Deliberate split in `src/consts.ts`.
- **License split:** code MIT (LICENSE), content CC BY 4.0 (LICENSE-CONTENT).
- **Later:** blog, projects, CV, visual style, favicon, i18n.
- **Socials:** GitHub `n0ct1s-k8sh` (will rename account someday — links only defined in
  consts.ts), X `f8th_io`, LinkedIn `ftolivo`.
- Owner may rename GitHub nick later: repo URLs redirect automatically, profile URL does not;
  Cloudflare Workers Builds needs a re-check after rename.

## Skills installed (committed, `skills-lock.json`)

`.agents/skills/`: astro, cloudflare, frontend-design, web-design-guidelines, web-quality-audit,
wrangler. Symlinks in `.claude/skills/`. Global (user-level): agent-browser (with own Chrome at
`~/.agent-browser/browsers/`), find-skills, orca-*, etc.
npm has an allow-list for install scripts: `fsevents` denied (fine, polling fallback);
`npm install-scripts approve <pkg>` when needed.

## Phases status

### 0 Prerequisites — mostly done
- Node 26.13.0 (LTS), pinned in `.nvmrc` (`26`). Terraform not needed anymore.
- GitHub repo public, exists, SSH + `gh` auth OK (user `n0ct1s-k8sh`).
- Cloudflare zone/DNSSEC: **not verified yet** (owner does dashboard setup).

### 1 Scaffold — done (commit `d0703b8`)
- Created with `npm create astro@latest <tmp>` (it refuses poison dirs with `.agents` etc.),
  files copied over. `package.json` name fixed to `f8th.io`. Files: minimal template + AGENTS.md
  + `.vscode/`. `astro.config.mjs` has `site: https://f8th.io`, `trailingSlash: "always"`.
- Engines: node >=22.23.4. Scripts: dev/build/postbuild/preview/check.

### 2 Config — done (`e9d73ff`)
- `*.astro` strict tsconfig. `astro check` = 0 errors (needs `@astrojs/check` + `typescript`).

### 3 Home/About — done (`ec5f591`)
- `src/consts.ts`, `BaseLayout.astro` (SEO head: charset, viewport, title, description, author,
  canonical from `Astro.url`, OG, twitter:card), `Header.astro`, `Footer.astro`,
  `SocialLinks.astro`, `src/styles/global.css`.
- CSS: `color-scheme: light dark`, CSS vars, `light-dark()` colors in oklch, container/prose,
  skip-link, focus-visible outlines, prefers-reduced-motion. No web fonts (system stack).

### 4 Pages — done (`e4d1ead`)
- `index.astro` (bio verbatim: 3 paragraphs), `404.astro` (NO layout — intentional, renders
  even if layout is broken; imports global.css directly), `public/robots.txt`.

### 5 README/licensing — done (`5cdf230`)
- README has local-testing table + checklist, structure, license split.

### Theme toggle — done (2 iterations: `34027c9` cycle button → `352ddd2` segmented control)
- **Final:** pill segmented **radiogroup** in Header: monitor=System, sun=Light, moon=Dark
  (inline SVG, currentColor, aria-labels). Important: **clicking sets the mode directly**
  (owner rejected cycling).
- Script: ONE inline block in BaseLayout `<head>`; sets `data-theme` on `<html>` before paint
  (FOUC avoidance), stores in localStorage key `theme` (removed for system).
- `renderThemeControls()` syncs aria-checked + roving tabindex; arrow keys move focus+selection
  with wrapping (APG). Keyboard listener lives in same script.
- CSS: `:root[data-theme="light|dark"]` set `color-scheme`; absence = system. `light-dark()`
  colors need NO duplication.
- ~3 kB inline JS. CSP in future must allow this one inline script (hash approach, done below).

### Branding — done (`c5ba1fe`)
- Header/link/title/og:title = `f8th.io`. Home `<title>` just `f8th.io` (no dup suffix).

### 6 Deploy — prep committed / deploy pending owner
- `wrangler.jsonc` (name `f8th-io`, assets dir `./dist`, `not_found_handling: "404-page"`),
  `public/_headers` CSP template, `scripts/generate-headers.mjs` (postbuild, hash generator)
  and `package.json` (+wrangler devDep, `postbuild`) were committed on 2026-11-04 (owner said
  "commit everything pending").
- `public/_headers` CSP script-src uses SHA-256 hashes, NOT unsafe-inline: the postbuild script
  computes hash(es) of inline scripts from dist (prefix `sha256-`, see Gotchas) and writes
  `dist/_headers`. style-src keeps `'unsafe-inline'` (Astro inlines <style>; Shiki later will
  need it).
- Verified locally with `wrangler dev --port 8787` (no auth needed): 200, 404 with 404 status,
  /index → 307 to / (assets `auto-trailing-slash`), headers present (HSTS, nosniff, XFO DENY,
  Referrer-Policy, Permissions-Policy, CSP).
- **CSP bug resolved (2026-11-03):** theme script didn't run under wrangler dev because
  `generate-headers.mjs` emitted the hash WITHOUT the required `sha256-` prefix — browsers
  treat a bare base64 string in `script-src` as an invalid source and silently ignore it.
  After the fix: theme + persistence work on 8787, zero console errors, Lighthouse 100 across
  all five categories (LCP 0.6 s, CLS 0). Lesson: CSP violations can be silent; verify with
  Lighthouse's console audit.
- **Codex logo/favicon episode (closed):**owner manually removed `logo.svg` +
  `apple-touch-icon.png`; chose “revert everything” over keeping the new favicon →
  `Header.astro`, `BaseLayout.astro`, `favicon.ico`, `favicon.svg` restored to the pre-branch
  state. No dangling references; rebuilt + re-verified (all requests 200).

**2026-11-04 (cf CLI adoption):** owner asked to install the Cloudflare CLI for resource
interaction; clarified the wrangler-vs-cf reality (cf released 2026-09-28 in beta,
wrangler NOT yet deprecated — final release at cf's beta end + 18 months maintenance).
Installed globally `cf 1.0.0-beta.27` (alias `cloudflare`), separate OAuth login via device
flow `cf auth login` (475 scopes granted — broad; wrangler's login stays narrow by default),
verified `cf workers list` sees `f8th-io`. **Boundary respected:** no `cf dev/build/deploy`
in this repo until `cf migrate` (unmigrated wrangler project = unsupported); wrangler keeps
dev/deploy/tail duties. Docs: AGENTS.md cloudflare bullet + docs/cloudflare.md §8. Account
id convenience var: `CLOUDFLARE_ACCOUNT_ID=63ea3638fe29274326746bdd6e9eb97b`.

**2026-11-04 (signing attempt — closed without adopting):** the "Main Prod" ruleset
(currentUser-created in the dashboard) blocks everyone but the owner: rules update/creation/
deletion/non_fast_forward + required_signatures + required_linear_history, with the owner
added as **bypass actor (always)** — pushes succeed via the bypass even unsigned (verified:
`96085a3..20f98f2` accepted), Dependabot PRs stay fine (GitHub signs its own commits).
SSH commit signing was configured locally (`gpg.format=ssh`, `user.signingKey
id_ed25519.pub`, `commit.gpgsign`, `tag.gpgsign`) but **dropped by owner** ("let's forget
our signing") when the signing-key registration couldn't complete cleanly — the signed top
commit came back `verified:false reason:unknown_key` — so the local config was unset and
signatures are simply not required of the owner (bypass covers it, badges may read
Unverified, cosmetic). If signing is ever revived, the missing piece is: register the
**existing** key again at Settings → SSH and GPG keys with type **Signing key** (the
macbookair key `AAAA…V9unScV`), then `git commit --amend` re-signs automatically.

**2026-11-04 (first production deploy — LIVE):** deploy target decision (morning session):
owner confirmed **Workers Static Assets**, not Pages (Pages would have meant discarding
`wrangler.jsonc`; the whole first-deploy walkthrough lived in docs/cloudflare.md and section
1 was executed manually). The site is now live on the custom domain `f8th.io` + `www`. Final live verify: apex 200; `www` 301 →
apex; `/index` 307 → `/`; `/nope/` → 404 with the styled 404 page; all five security headers
present; CSP hash `sha256-V1wElLtHBTI/XAQ1NpXSlNE56CY3O2mLrDlKSc2tZg4=` matches the
generated one byte-for-byte. Production Lighthouse: 100 across performance/accessibility/
best-practices/SEO/agentic-browsing, no failing audits (LCP 0.8 s, CLS 0, TBT 0 ms).

- **www setup:** CNAME `www` → apex, **Proxied** (orange) was created; attaching via Worker
  custom-domain was option A. Lesson: a proxied DNS record is a *prerequisite* for a redirect
  rule to see the hostname — the dashboard's "missing DNS" complaint meant exactly that.
- **Rogue-rule loop (closed):** an owner-created custom "HTTP(S) redirect" rule had no/scoped
  hostname condition and rebuilt the URL from request fields → every apex request 308→301
  self-loop (`/robots.txt` → `https://f8th.io/robots.txt`). Rule disabled — signature kept:
  a rule that echoes back the SAME host+path it received with a full-URL Location is always
  a mis-scoped redirect rule; www preset + hostname `equals www.f8th.io` is the only rule
  that should exist.
- **Always Use HTTPS: DONE (same day).** With the rogue rule removed, `http://f8th.io/`
  silently 200'd (the bad rule used to 301 it by accident) → owner flipped SSL/TLS → Edge
  Certificates → "Always Use HTTPS" (HSTS `max-age=31536000; includeSubDomains; preload`
  was already present for browsers) → verified live: `http://f8th.io/` 301s cleanly to
  the apex.
- **First Workers Builds git deploy: SUCCESS** ("Ready" in the dashboard) and the post-deploy
  verification matrix is identical to the manual one — same status codes, headers, CSP hash.
  Pipeline build command / NODE_VERSION confirmed correct; auto-deploy on push is now the
  routine path (manual `wrangler deploy` = fallback only).
- **DNSSEC: DONE & ACTIVE (same day).** Owner completed the toggle + DS-at-Spaceship;
  verified live 2026-11-04: DS `2371 13 2 …AEB41316` published at the .io TLD, DNSKEYs
  (KSK 257 3 13 + ZSK 256 3 13, ECDSA P-256) served by `jake.ns.cloudflare.com`, and all
  three public validating resolvers (9.9.9.9, 8.8.8.8, 1.1.1.1) return `flags: …ad` for
  the apex = the DS→DNSKEY→RRSIG chain validates. Quick-check recipe for future agents:
  `dig +dnssec f8th.io @1.1.1.1` and look for `ad` in flags.
- **Workers Builds git integration:** owner enabled it today before the last checks. Next
  push to `main` (this journal commit) is the first end-to-end git-deploy test — if the
  build tab shows success but the live site breaks, suspect the pipeline's build command /
  NODE_VERSION=26 first.

**2026-11-04 housekeeping session:** all test servers/processes stopped (`astro preview`,
`wrangler dev`/workerd, agent-browser + headless Chrome; ports 4321/8787 free). Added mandatory
"Project journal" section to AGENTS.md (owner asked for it). Decided `MEMORY.md` becomes a
**committed project journal** (owner's call, 2026-11-04) — update it every session and commit
it. Committed & pushed to `main`: deploy plumbing `54b43a9` (wrangler.jsonc, `_headers`
template, generate-headers.mjs, package.json+lockfile) and docs `b7ca126` (AGENTS.md journal
mandate + MEMORY.md). `npm run check` clean before both commits; one transient push timeout
then retry (as before — retry works).

## Verification done

- `npm run check`: 0 errors (last run, after 4321 tests and branding).
- Browser (agent-browser): light/dark/mobile screenshots OK (light2/mobile2 fixed names,
  dark from first round); screenshots sometimes capture blank white — timing artifact, retake.
- Accessibility tree checked (skip link, radios with aria-labels, socials).
- Theme matrix verified: system/light/dark switching, persistence across reload, media emulation
  vs pinned mode, storage cleared on System.

## Gotchas / learnings

- Astro keeps HTML comments in output (owner knows; may strip later with rehype plugin).
- Astro minifies HTML/CSS/inline JS only at build — whitespace inside expressions collapses
  (learned via `Olivo·` bug); use `&nbsp;` where spacing matters.
- `<script is:inline>` renders as plain `<script>` (directive disappears).
- Duplicate `const` in inline script = whole script SyntaxError, silent from outside (found via
  `agent-browser errors --json`). Always run `node --check` on built inline script.
- committed/pushed: origin ssh OK (had one transient publickey error — retry works).
- `find` for device reset: `agent-browser set device` needs one of listed names; viewport resets
  device independently.
- push `--force-with-lease` was used once when fixing a commit message (fine, own repo).
- localStorage cleared at the end of each test round — user may see System defaults.

## Current server state

- None running (verified 2026-11-04: ports 4321/8787 free, no astro/wrangler/workerd/
  agent-browser/Chrome-for-Testing processes). Relaunch as needed.

## Next steps (after the CSP bug is resolved) → CSP solved, onto owner actions

1. ~~Commit the Phase 3 prep files~~ — done 2026-11-04.
2. Owner action needed (can't do for them): Cloudflare dashboard —
   login via `npx wrangler login` (interactive), then either
   `npx wrangler deploy` for a quick first deploy (workers.dev URL), or
   connect the repo to **Workers Builds** in dashboard (git integration, build `npm run build`,
   output `dist`, Node 26 → `.nvmrc`; set `NODE_VERSION=26`).
3. Zone setup: add `f8th.io` zone (Free), nameservers at Spaceship, DNSSEC + DS record.
   Custom domain f8th.io on the worker + `www` redirect rule via Single Redirect.
4. ~~`docs/cloudflare.md` for manual dashboard decisions~~ — written 2026-11-04
   (owner chose "walk me through it": deployment stays manual; doc covers login → deploy,
   zone/Spaceship NS, custom domain on worker, www Single Redirect, DNSSEC both sides,
   Workers Builds git setup as phase 2 of deploys, and a verification checklist).
5. Phase 4: ci.yml, dependabot (npm, github-actions), branch protection, then PRs from now on.
   → ci.yml + dependabot.yml committed 2026-11-04; first CI run on that push: **success**
   in 27 s (workflow run 41883452636), Dependabot update jobs completed too. **Branch
   protection: owner declined the PR requirement** ("kinda dumb to restrict myself" — solo
   repo). Agreed setup: protection optional, force-push/deletion bans only; PRs for
   Dependabot + risky refactors; direct `main` commits stay the routine for small work.
   AGENTS.md discipline updated to match.

## Plan docs

Full agreed plan lives in conversation; phase numbering: 0 prereqs, 1 scaffold, 1.5 local testing
checklist, 2 home/about, 3 deploy (wrangler + dashboard + `_headers`), 4 CI, 5 later (blog,
projects/CV, visual style: mentioned `frontend-design` + `web-design-guidelines` skills).

## Owner prefs to remember

- Prefers concrete visual patterns (asked for icon segmented control, not text/cycle).
- Will rename GitHub nick later.
- Likes short, commented, learning-oriented code.
- Check in before committing anything beyond the obvious.
