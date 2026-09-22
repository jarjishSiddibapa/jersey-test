export function formatPrice(amount: number, currency = "USD"): string {
  // Below $1, gentle daily compounding can move the price by fractions of
  // a cent; showing up to 4 decimals keeps day-to-day change visible
  // instead of every early price rounding down to the same "$0.01".
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: amount < 1 ? 4 : 2,
  });
  return formatter.format(amount);
}

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isSafeUrl(url: string): boolean {
  try {
    // Website inputs are always normalized to an absolute URL before
    // reaching here (see normalizeWebsiteUrl), so a base is never
    // actually needed to resolve them - but guard the `window` read
    // anyway so this stays callable outside a browser (Node tests, a
    // future SSR/build-time OG generation step) without throwing.
    const base = typeof window !== "undefined" ? window.location.origin : undefined;
    const parsed = new URL(url, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Normalizes, validates (http/https only) and HTML-attribute-escapes a
 * user-submitted website URL in one step. Returns null for anything
 * unsafe or malformed so callers can simply omit the link rather than
 * ever interpolate a raw, un-escaped value into an href attribute - the
 * un-escaped-href path is exactly how a website value like
 * `https://x.com" onmouseover="...` would otherwise break out of the
 * attribute and inject a live event handler.
 */
export function safeWebsiteHref(url: string): string | null {
  const normalized = normalizeWebsiteUrl(url);
  if (!normalized || !isSafeUrl(normalized)) return null;
  return escapeHtml(normalized);
}
