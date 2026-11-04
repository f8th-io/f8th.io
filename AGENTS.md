# AGENTS.md

Instructions for AI agents working in this repo (OpenCode, Claude, etc.).
Personal site of Fran T. Olivo (`https://f8th.io`): Astro 7 static site,
deployed to Cloudflare Workers Static Assets. Small repo — prefer minimal,
explicit, commented code. The owner is learning the stack: explain non-obvious
choices in code comments (that's a requirement, not decoration).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Project journal (mandatory)

Before finishing any session — and before any handoff, no matter how small the
work — update **`MEMORY.md`** (at the repo root, committed to git) with:

- **What was done:** every change made, file by file; what was verified and how
  (server used, `astro check`/Lighthouse/`node --check` results with key numbers).
- **Decisions made:** the choice *and the why* — including alternatives that
  were rejected and, when the owner chose between options, **which option they
  picked** (recent decisions must not be re-litigated by the next agent).
- **Anything in flight:** unfinished work, WIP files owned by others in the
  tree (state them — don't silently revert or "clean up"), pending
  owner-visible actions (e.g. dashboard steps), and open questions.
- **History worth keeping:** solved bugs with their root cause, reproduction
  recipes, interview-quality notes a future session would otherwise rediscover.

Practical rules:

- Update it as you go (after each milestone), not only at the very end — a
  crashed session loses nothing that way.
- Newest entries first, dated. Keep the file current and readable; prune
  resolved items that have lost all value, but always keep the "why" of past
  decisions.
- `MEMORY.md` is part of the repo — **commit it with your changes** so the
  context survives for humans browsing the repo, not just other agents.
- Assume the next session starts with zero context: read `MEMORY.md` before
  touching anything, and write it so it stands alone.

## Commands

| Command | What / when |
| --- | --- |
| `npm run check` | `astro check` (types + config). Run before every commit. |
| `npm run build` | Builds `dist/` **and regenerates `dist/_headers`** (a `postbuild` step hashes the inline theme script into the CSP). Never run `npx astro build` directly — the CSP hash would go stale. |
| `npm run preview` | Serves `dist/` as plain static files. |
| `npx wrangler dev --port 8787` | Local Cloudflare simulation (security headers, `_redirects`, 404 handling). Needs `npm run build` first. |
| `npx wrangler deploy` | Ships `dist/` to the production Worker (needs `npx wrangler login`). |

**SOLVED (2026-11-03):** the theme script once didn't run under `wrangler dev`
(8787) while working on `preview` (4321). Root cause: `generate-headers.mjs`
emitted the CSP hash *without* the required `sha256-` prefix, so browsers
silently ignored the source and blocked the inline script. Kept here as a
lesson: CSP violations can be silent — verify with Lighthouse's console audit.

## Conventions that differ from Astro defaults

- Names and links are defined **only** in `src/consts.ts`: `SITE_TITLE` is the
  brand (`f8th.io`, used by header/`<title>`/og:title), `AUTHOR` is the person
  (About h1, footer, `meta author`). Home passes `SITE_TITLE` as its title to
  avoid the `f8th.io — f8th.io` suffix in `BaseLayout`.
- Theme system: absence of `data-theme` on `<html>` = follow the OS; the pinned
  values `light`/`dark` live in `localStorage["theme"]`. The theme script
  (inline, in `BaseLayout`'s `<head>`) must run **before paint** (FOUC), syncs
  `aria-checked`/roving-tabindex of the header radiogroup (`#theme-switch`),
  and is the CSP-hashed script above. A duplicate `const` in it is a *silent*
  `SyntaxError` that kills the whole script — `node --check` the built output
  if theme behaviour breaks. CSS reacts via `:root[data-theme=…]` in
  `src/styles/global.css`; `light-dark()` colours need no duplication.
- `404.astro` deliberately does **not** use `BaseLayout` (must render even if
  the layout is broken).
- Astro ships `.astro` HTML comments to the browser, and whitespace around
  `{expressions}` collapses (`{A}\n· {B}` renders glued). Use `&nbsp;` where a
  space must survive.

## Cloudflare deployment

- `public/_headers` is a **template**; `scripts/generate-headers.mjs`
  (`postbuild`) writes the final `dist/_headers`. Edit the template only.
  `style-src 'unsafe-inline'` is required (Astro inlines `<style>`; Shiki will
  too). script-src is hash-based — keep it that way.
- `wrangler.jsonc` is an assets-only Worker: no `main`, `not_found_handling:
  "404-page"`. Trailing slashes are handled by the assets router
  (`auto-trailing-slash`, matches `astro.config.mjs → trailingSlash: "always"`).
- Deploys run **continuously via Workers Builds** (git integration, owner
  enabled 2026-11-04): push to `main` → build → deploy. Manual `npx wrangler
  deploy` is the fallback only (e.g. when the pipeline fails) — don't use it
  as the routine path.
- Dashboard decisions (DNS, `www` redirect, Workers Builds git integration) are
  made manually by the owner. **No Terraform** — discarded on purpose; don't
  reintroduce it.

## Discipline

- CI runs on every push/PR (`.github/workflows/ci.yml`: `npm ci`, `check`,
  `build`) as an **alarm, not a gate** — the owner chose no PR round-trips
  for solo work (2026-11-04): small direct commits to `main` are fine; red
  CI means investigate before the next push, never stack fixes.
- If branch protection is enabled, it's for the free wins only: ban force
  pushes and branch deletion, no PR requirement, no admin-pr exceptions
  needed. PRs are for Dependabot updates and large/risky refactors.
- Deploy ≠ CI: pushing to `main` triggers both a Workers Builds deploy and a
  CI run; the pipeline only deploys a successful build, so a bad push shows
  up as a failed deployment rather than a broken site.
- Keep dependencies minimal: no UI frameworks, no Tailwind, no themes.
- npm's install-script allowlist blocks `fsevents` (harmless, polling
  fallback). Don't "fix" it silently.
- `MEMORY.md` is the agents' project journal — committed on purpose (owner,
  2026-11-04). Always update and include it when committing.
- Node 26 is pinned in `.nvmrc` (local); `engines` requires >=22.23.4.

## Documentation

Full docs https://docs.astro.build. Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
