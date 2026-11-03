// Astro reads this once, at build time. None of this runs in a browser.
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // The final URL of the deployed site. Astro uses it to build absolute URLs:
  // canonical links now, and sitemap/RSS links once we add the blog.
  // Keep it in sync with the actual domain or canonical tags will be wrong.
  site: 'https://f8th.io',

  // URLs end with a trailing slash: https://f8th.io/about/ instead of /about.
  // "always" matches how the static build generates one index.html per folder,
  // and how Cloudflare serves those files, so alternate URL forms never appear.
  // NOTE: this only affects dev; the static build always uses directory format.
  trailingSlash: 'always',
});
