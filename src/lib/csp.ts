/**
 * Content Security Policy.
 *
 * Kept in its own module (rather than inline in the middleware) so the host
 * allowlists can be asserted in tests — a missing entry here silently breaks a
 * feature at runtime, which is exactly what happened to the map tiles.
 */

/** Place and business photography. Keep in sync with images.remotePatterns in next.config.mjs. */
export const IMAGE_HOSTS = [
  "https://images.unsplash.com",
  "https://source.unsplash.com",
  "https://res.cloudinary.com",
  "https://upload.wikimedia.org",
  "https://static.wixstatic.com",
  "https://images.weserv.nl",
  "https://media.4-paws.org",
  "https://dynamic-media-cdn.tripadvisor.com"
];

/**
 * Map tiles. Leaflet renders tiles as <img> elements, so they must be allowed
 * by img-src or the map draws an empty grid. Leaflet substitutes `{s}` with a
 * subdomain (a/b/c), and `*.host` is the CSP way to cover those — the bare
 * hosts are listed as well so a template without `{s}` still works.
 */
export const MAP_TILE_HOSTS = [
  "https://*.tile.openstreetmap.org",
  "https://tile.openstreetmap.org",
  "https://*.basemaps.cartocdn.com",
  "https://basemaps.cartocdn.com"
];

/** Weather, media uploads, and map tiles requested from the client. */
export const CONNECT_HOSTS = [
  "https://api.open-meteo.com",
  "https://res.cloudinary.com",
  "https://api.cloudinary.com",
  ...MAP_TILE_HOSTS
];

export function buildCsp(nonce: string, isDevelopment = process.env.NODE_ENV !== "production"): string {
  const scriptSrc = [`'self'`, `'nonce-${nonce}'`];

  // Next.js dev serves modules wrapped in eval(); the client bundle is blocked
  // without this, and nothing hydrates. Production stays strict.
  if (isDevelopment) {
    scriptSrc.push(`'unsafe-eval'`);
  }

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(" ")}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${[...IMAGE_HOSTS, ...MAP_TILE_HOSTS].join(" ")}`,
    `font-src 'self'`,
    `connect-src 'self' ${CONNECT_HOSTS.join(" ")}`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`
  ].join("; ");
}

/** True when `host` is covered by a CSP source expression in `directive`. */
export function cspAllows(directive: string, host: string): boolean {
  const sources = directive.split(/\s+/).filter((token) => token.startsWith("https://"));

  return sources.some((source) => {
    const allowed = source.replace("https://", "").replace(/\/$/, "");

    if (allowed === host) return true;

    if (allowed.startsWith("*.")) {
      const base = allowed.slice(2);
      // `*.example.com` covers subdomains and, in practice, example.com itself.
      return host === base || host.endsWith(`.${base}`);
    }

    return false;
  });
}
