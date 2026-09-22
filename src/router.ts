import type { LegalSlug, Route } from "./types";

const LEGAL_SLUGS: LegalSlug[] = ["rules"];

/**
 * Hash-based routing (#/spot/37, #/terms, ...) rather than real paths:
 * GitHub Pages serves this as a static bundle with no server-side
 * rewrite, so a path-based route like /spot/37 would 404 on a hard
 * refresh or a fresh visit to a shared link. A hash never leaves the
 * client, so it always resolves to index.html first. The tradeoff -
 * classic (non-JS) crawlers see the same OG tags for every route - is
 * real and is called out in the README; fixing it properly needs either
 * prerendering at build time or a real server, both of which need a
 * backend that doesn't exist yet.
 */
export function parseHash(hash: string = window.location.hash): Route {
  const clean = hash.replace(/^#\/?/, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts[0] === "spot" && parts[1]) {
    const id = Number(parts[1]);
    if (Number.isInteger(id) && id > 0) return { name: "spot", id };
  }
  if (parts.length === 1 && (LEGAL_SLUGS as string[]).includes(parts[0])) {
    return { name: "legal", slug: parts[0] as LegalSlug };
  }
  return { name: "home" };
}

export function spotHash(spotId: number): string {
  return `#/spot/${spotId}`;
}
