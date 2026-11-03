# f8th.io

Personal website of **Fran T. Olivo** — SRE & Platform Engineer.
Live at <https://f8th.io> once deployed.

A deliberately small site: static pages, hand-written CSS, zero
client-side JavaScript. Built with [Astro](https://astro.build) and
hosted on [Cloudflare Workers
Static Assets](https://developers.cloudflare.com/workers/static-assets/)
(free tier).

## Stack

| Area     | Choice                                              |
| -------- | --------------------------------------------------- |
| SSG      | Astro 7 (minimal template, no theme)                |
| Language | TypeScript, strict                                  |
| Content  | Plain HTML components now; Markdown collections later |
| Styling  | Plain CSS: one global file + scoped `<style>` blocks |
| JS       | One tiny inline theme script; otherwise none        |

## Prerequisites

- Node.js 26 (LTS) — the exact version is pinned in `.nvmrc`
- npm

```sh
nvm use   # reads .nvmrc
npm ci    # install exactly the versions in package-lock.json
```

## Local testing

| Step            | Command          | Notes                                           |
| --------------- | ---------------- | ----------------------------------------------- |
| Type check      | `npm run check`  | Catches TS + config errors; same as CI          |
| Dev server      | `npm run dev`    | <http://localhost:4321>, reloads on save        |
| Production build| `npm run build`  | Outputs `dist/`; fails on anything invalid      |
| Preview build   | `npm run preview`| Serves exactly what will be deployed            |
| Cloudflare-like | `npx wrangler dev` | Phase 3: adds `_headers`, 404 behaviour       |

Before pushing, check:

- [ ] Light **and** dark mode render correctly (flip the OS theme), and the
      header toggle cycles System → Light → Dark and survives a reload
- [ ] An unknown URL shows the custom 404 page
- [ ] DevTools → Network → JS: no JS *files* (the theme script is inline)
- [ ] Lighthouse scores ~100 on all categories (run against `preview`)

## Writing pages

Pages live in `src/pages/`, one file = one route:

```sh
src/pages/index.astro  → https://f8th.io/
src/pages/about.astro  → https://f8th.io/about/
```

- Names, roles and social handles live in `src/consts.ts` — edit them there,
  not in the pages, so they stay consistent.
- Page-level styles go in a scoped `<style>` block in the page;
  site-wide typography and colours in `src/styles/global.css`.

## Project structure

```
├── public/              # copied as-is: favicon, robots.txt
├── src/
│   ├── components/      # Header, Footer, SocialLinks
│   ├── layouts/
│   │   └── BaseLayout.astro   # <head>, SEO meta, header/footer
│   ├── pages/           # one file = one URL
│   ├── styles/
│   │   └── global.css   # theme variables, typography, light/dark mode
│   └── consts.ts        # site title, description, social handles
├── astro.config.mjs     # site URL, trailingSlash
└── .nvmrc               # Node version
```

## Deployment

In Phase 3 the repo is connected to Cloudflare Workers Builds: pushes to
`main` deploy automatically, pull requests get preview URLs. Until then,
deploy = `npm run build` + manual upload, or just test locally.

## License

Split license, common for personal sites:

- **Code** (`.astro`, `.ts`, `.css`, config): [MIT](LICENSE)
- **Content** (prose, bio text): [CC BY 4.0](LICENSE-CONTENT)

What this means in practice: anyone may share or adapt the site's written
content, crediting Fran T. Olivo; the code follows the MIT LICENSE.
