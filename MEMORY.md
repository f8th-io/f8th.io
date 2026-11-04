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

**2026-11-04 (deploy walkthrough session):** owner confirmed target is **Workers Static
Assets** (not Pages — clarifying question asked and answered; Pages would have meant
discarding `wrangler.jsonc`). Owner requested manual first deploy → `docs/cloudflare.md`
written with the full ordered walkthrough: `wrangler login` → `whoami` → `npm run build` →
`wrangler deploy` + workers.dev verification checks, zone/Spaceship nameserver handover,
custom-domain attach on the worker, `www` Single Redirect rule, DNSSEC (DS record from CF
into Spaceship), then Workers Builds git integration (build cmd `npm run build`,
`NODE_VERSION=26`) as the continuous path, plus a domain-level curl verification checklist.
Owner's next action = run section 1 of that doc themselves; worker name `f8th-io` means the
preview URL will be `f8th-io.<their-subdomain>.workers.dev`.

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

## Plan docs

Full agreed plan lives in conversation; phase numbering: 0 prereqs, 1 scaffold, 1.5 local testing
checklist, 2 home/about, 3 deploy (wrangler + dashboard + `_headers`), 4 CI, 5 later (blog,
projects/CV, visual style: mentioned `frontend-design` + `web-design-guidelines` skills).

## Owner prefs to remember

- Prefers concrete visual patterns (asked for icon segmented control, not text/cycle).
- Will rename GitHub nick later.
- Likes short, commented, learning-oriented code.
- Check in before committing anything beyond the obvious.
