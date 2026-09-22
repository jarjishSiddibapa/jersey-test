import type { Attribution } from "./attribution";

/**
 * Event architecture from PHASE 15 / section 22 of the product spec.
 * Nothing here calls out to a real analytics vendor - AnalyticsProvider
 * is the seam a real one (PostHog, GA4, Amplitude, ...) would plug into.
 * ConsoleAnalyticsProvider just logs in dev so the call sites are real
 * and exercised, without pretending data is going anywhere.
 */
export type AnalyticsEvent =
  | "page_view"
  | "jersey_view"
  | "spot_hover"
  | "spot_selected"
  | "search_used"
  | "logo_upload_started"
  | "logo_upload_completed"
  | "checkout_started"
  | "payment_started"
  | "payment_succeeded"
  | "payment_failed"
  | "spot_shared"
  | "public_spot_view"
  | "outbound_click"
  | "referral_visit";

export interface AnalyticsProvider {
  track(event: AnalyticsEvent, payload?: Record<string, unknown>): void;
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  private readonly attribution: Attribution;

  constructor(attribution: Attribution) {
    this.attribution = attribution;
  }

  track(event: AnalyticsEvent, payload: Record<string, unknown> = {}): void {
    if (!import.meta.env?.DEV) return;
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${event}`, { ...payload, attribution: this.attribution });
  }
}
