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
  purchaseDay?: number;
  purchasedAt?: string;
  isDemo?: boolean;
}

export interface PricingConfig {
  basePrice: number;
  growthMultiplier: number;
  /** length of one pricing "day" in milliseconds */
  pricingInterval: number;
  maximumPrice: number | null;
  currency: string;
  /** ISO date string the project (and Day 1 pricing) started */
  projectStartDate: string;
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
  demoDay: number | null;
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
