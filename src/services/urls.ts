/**
 * Environment-aware base URL. Uses VITE_SITE_URL when set (the real lever
 * for pointing every share link / OG tag at a future custom domain
 * without touching code - see README env vars), otherwise derives it from
 * where the app is actually running, including Vite's own BASE_URL
 * (already project-path-aware for GitHub Pages, see vite.config.ts).
 * Nothing in the app should ever hardcode the GitHub Pages URL - this is
 * the one place a real domain gets plugged in later.
 */
export function siteBaseUrl(): string {
  const envUrl = import.meta.env?.VITE_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, "");
}

export function spotPublicUrl(spotId: number): string {
  return `${siteBaseUrl()}/#/spot/${spotId}`;
}

export function legalPublicUrl(slug: string): string {
  return `${siteBaseUrl()}/#/${slug}`;
}
