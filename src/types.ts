export type SpotRegion = "chest" | "sleeve" | "lower" | "shoulder";

export type SpotTier = "standard" | "premium" | "hero";

export type SpotStatus = "available" | "reserved" | "claimed";

export type ModerationStatus = "pending" | "approved" | "rejected" | "disabled";

export interface Spot {
  id: number;
  editionId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  region: SpotRegion;
  tier: SpotTier;
  status: SpotStatus;
  buyerName?: string;
  website?: string;
  logoUrl?: string;
  tagline?: string;
  pricePaid?: number;
  /** 1-indexed position this spot was claimed in, across the WHOLE edition (1 = the very first sale). */
  purchaseRank?: number;
  purchasedAt?: string;
  orderId?: string;
  moderationStatus?: ModerationStatus;
  isDemo?: boolean;
  /** local-only counters; a real backend would own these (see services/analytics.ts). */
  profileViews?: number;
  outboundClicks?: number;
}

/**
 * Server-authoritative pricing config for a campaign/edition. Frontend may
 * DISPLAY prices derived from this; it must never be trusted to DEFINE
 * them (see services/pricing.ts and PHASE 27 of the product spec this
 * models). No artificial maximum price - growth is unbounded by design.
 */
export interface PricingConfig {
  startingPrice: number;
  /** fraction the base price rises by after EVERY spot claimed, e.g. 0.06 = +6% per claim. */
  growthRate: number;
  currency: string;
}

export const TIER_MULTIPLIERS: Record<SpotTier, number> = {
  standard: 1,
  premium: 3,
  hero: 5,
};

export type CampaignStatus = "draft" | "live" | "paused" | "sold_out" | "archived";

/** Edition/campaign metadata - the abstraction that lets a future Edition 002 exist without a rewrite. */
export interface Campaign {
  id: string;
  slug: string;
  name: string;
  description: string;
  totalSpots: number;
  tierCounts: Record<SpotTier, number>;
  pricing: PricingConfig;
  status: CampaignStatus;
  launchAt: string;
  closedAt: string | null;
}

export interface ActivityEntry {
  id: string;
  spotId: number;
  buyerName: string;
  tier: SpotTier;
  pricePaid: number;
  timestamp: string;
  isDemo?: boolean;
}

export type ClaimStep = "form" | "success";

export interface PendingClaim {
  spotIds: number[];
  buyerName: string;
  company: string;
  email: string;
  website: string;
  tagline: string;
  logoUrl?: string;
  agreedToTerms: boolean;
}

// ---------------- order / buyer / payment models ----------------
// These shapes mirror what a real MySQL-backed API would store (see
// services/orderService.ts, services/paymentProvider.ts). In this
// "architecture-ready, not wired" build they're persisted to localStorage
// by the same repository interface a real backend implementation would
// sit behind - see services/repository.ts.

export interface Buyer {
  id: string;
  name: string;
  company?: string;
  email: string;
  website?: string;
  country?: string;
  createdAt: string;
}

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  spotId: number;
  purchaseRank: number;
  tier: SpotTier;
  unitBasePrice: number;
  tierMultiplier: number;
  finalPrice: number;
}

export interface Order {
  id: string;
  editionId: string;
  buyerId: string;
  items: OrderItem[];
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentId: string | null;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
}

/** A short-lived hold on a spot while a buyer is checking out. Expires so it never permanently blocks a spot if the buyer abandons checkout. */
export interface Reservation {
  spotId: number;
  buyerSessionId: string;
  createdAt: string;
  expiresAt: string;
}

export interface ClickEvent {
  spotId: number;
  kind: "profile_view" | "outbound_click";
  timestamp: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export interface AppState {
  campaign: Campaign;
  spots: Spot[];
  activity: ActivityEntry[];
  viewingSpotId: number | null;
  claimStep: ClaimStep | null;
  pendingClaim: PendingClaim | null;
  formErrors: Record<string, string>;
  lastOrderId: string | null;
  searchQuery: string;
  route: Route;
  /** Local dev/demo tooling only - compiled out of production builds (see components/devTools.ts). */
  devToolsOpen: boolean;
}

export type Route =
  | { name: "home" }
  | { name: "spot"; id: number }
  | { name: "legal"; slug: LegalSlug };

export type LegalSlug = "rules";
