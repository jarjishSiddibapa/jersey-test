export type SpotRegion = "chest" | "sleeve" | "lower" | "shoulder";

export type SpotStatus = "available" | "claimed";

export interface Spot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  region: SpotRegion;
  status: SpotStatus;
  buyerName?: string;
  website?: string;
  logoUrl?: string;
  pricePaid?: number;
  /** 1-indexed position this spot was claimed in (1 = the very first sale) */
  purchaseRank?: number;
  purchasedAt?: string;
  isDemo?: boolean;
}

export interface PricingConfig {
  basePrice: number;
  /** multiplier applied per spot sold, e.g. 1.08 = price rises ~8% with every claim */
  growthMultiplier: number;
  maximumPrice: number | null;
  currency: string;
}

export interface ActivityEntry {
  id: string;
  spotId: number;
  buyerName: string;
  pricePaid: number;
  timestamp: string;
  isDemo?: boolean;
}

export type ClaimStep = "selecting" | "form" | "checkout" | "success";

export interface PendingClaim {
  spotId: number;
  buyerName: string;
  website: string;
  logoUrl?: string;
}

export interface AppState {
  config: PricingConfig;
  spots: Spot[];
  activity: ActivityEntry[];
  selectionMode: boolean;
  selectedSpotId: number | null;
  viewingSpotId: number | null;
  claimStep: ClaimStep | null;
  pendingClaim: PendingClaim | null;
  lastPurchasedSpotId: number | null;
  searchQuery: string;
  prototypeAdminOpen: boolean;
}
