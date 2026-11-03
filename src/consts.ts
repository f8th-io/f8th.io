// Single source of truth for names and links that appear on more than one page.
// Change a value here and every page using it updates on the next `npm run build`.

// Site brand: used in the header and as the <title>/Open Graph site name.
// (Short name = "f8th.io"; the person's name lives in AUTHOR below.)
export const SITE_TITLE = "f8th.io";

// Fallback <meta name="description"> used on pages that don't pass one.
export const SITE_DESCRIPTION = "SRE & Platform Engineer";

// Person's name: About heading, footer, meta author.
export const AUTHOR = "Fran T. Olivo";

// Handles live here so a rename is a one-line change. social links are built
// from these constants below instead of being typed out somewhere else.
export const GITHUB_USER = "n0ct1s-k8sh";
export const X_USER = "f8th_io";
export const LINKEDIN_USER = "ftolivo";

// `as const` makes TypeScript infer literal types for each field instead of a
// generic string — the compiler then knows these objects never change shape.
export const SOCIAL_LINKS = [
  { name: "GitHub", href: `https://github.com/${GITHUB_USER}` },
  { name: "X", href: `https://x.com/${X_USER}` },
  { name: "LinkedIn", href: `https://www.linkedin.com/in/${LINKEDIN_USER}` },
] as const;
