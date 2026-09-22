/**
 * Captures UTM params / a `?ref=` referral code / document.referrer on
 * first load and holds them for the rest of the session, so a checkout
 * that happens minutes later can still be attributed to whatever brought
 * the visitor in. Read once at boot (see main.ts); never sent anywhere
 * except into this session's own analytics events and order metadata.
 */
export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  ref: string | null;
  referrer: string | null;
}

const STORAGE_KEY = "internet-jersey:attribution";

export function captureAttribution(): Attribution {
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing) as Attribution;
  } catch {
    // fall through to a fresh capture
  }

  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    ref: params.get("ref"),
    referrer: document.referrer || null,
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage unavailable (private browsing); attribution is still usable for this call
  }

  return attribution;
}
