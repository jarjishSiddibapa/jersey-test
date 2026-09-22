import type { PricingConfig, Spot } from "../types";

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  basePrice: 0.01,
  // A gentle per-spot compounding rate (not a doubling) so the price stays
  // interesting across all 300 spots instead of hitting the cap in the
  // first few dozen sales. ~8% per spot sold reaches the $2,500 cap
  // around the 160th spot claimed.
  growthMultiplier: 1.08,
  maximumPrice: 2500,
  currency: "USD",
};

/** The first N spots claimed are tagged as founding members. */
export const FOUNDING_SPOT_THRESHOLD = 10;

/** Price for the Nth spot ever claimed (1-indexed: rank 1 is the very first sale). */
export function getPriceForRank(config: PricingConfig, rank: number): number {
  const raw = config.basePrice * Math.pow(config.growthMultiplier, Math.max(0, rank - 1));
  // Rounding to whole cents would hide most of the early compounding
  // (1.08x/spot doesn't clear a full cent for several sales) - round to a
  // finer step instead so the price visibly moves from spot to spot.
  const rounded = Math.round(raw * 10000) / 10000;
  if (config.maximumPrice !== null) return Math.min(rounded, config.maximumPrice);
  return rounded;
}

/** Price the NEXT spot (the one that hasn't sold yet) will go for. */
export function getCurrentPrice(config: PricingConfig, spots: Spot[]): number {
  return getPriceForRank(config, getClaimedSpots(spots).length + 1);
}

/** Price the spot AFTER that one will go for, once the current one sells. */
export function getNextPrice(config: PricingConfig, spots: Spot[]): number {
  return getPriceForRank(config, getClaimedSpots(spots).length + 2);
}

export function getClaimedSpots(spots: Spot[]): Spot[] {
  return spots.filter((s) => s.status === "claimed");
}

export function getAvailableSpots(spots: Spot[]): Spot[] {
  return spots.filter((s) => s.status === "available");
}

export function getRemainingSpotCount(spots: Spot[]): number {
  return getAvailableSpots(spots).length;
}
