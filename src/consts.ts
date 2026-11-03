// Single source of truth for names and links that appear on more than one page.
// Change a value here and every page using it updates on the next `npm run build`.

// The <title> and displayed name of the site.
export const SITE_TITLE = "Fran T. Olivo";

// Fallback <meta name="description"> used on pages that don't pass one.
export const SITE_DESCRIPTION = "SRE & Platform Engineer";

// Displayed name (footer, About heading). Kept separate from SITE_TITLE so we
// can later use a shorter brand in the header, e.g. "f8th.io".
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
