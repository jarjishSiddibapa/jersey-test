import type { PricingConfig, Spot, SpotTier } from "../types";
import { TIER_MULTIPLIERS } from "../types";

/**
 * Server-authoritative pricing engine. In a real deployment this file
 * (or its direct equivalent) runs ONLY on the backend - the client would
 * merely display numbers the server already computed, and every order
 * amount would be recalculated and verified server-side before a
 * payment is accepted (see services/orderService.ts, services/
 * paymentProvider.ts). It's still the single source of truth here
 * because there is no live backend yet; nothing about swapping it out
 * later requires touching a caller.
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  startingPrice: 0.1,
  // +6% on the BASE price after every single spot claimed, applied to the
  // one global purchase sequence (not per tier, not per day). No cap:
  // rank 200 lands around $10,861 base by design.
  growthRate: 0.06,
  currency: "USD",
};

/** The first N spots claimed are tagged as founding members. */
export const FOUNDING_SPOT_THRESHOLD = 10;

function roundCurrency(amount: number): number {
  // Round to a finer step than whole cents so early, sub-$1 prices still
  // visibly move from claim to claim instead of all reading "$0.10".
  return Math.round(amount * 1e6) / 1e6;
}

/** Base price (before any tier multiplier) for the Nth spot ever claimed, edition-wide. 1-indexed: rank 1 is the very first sale. */
export function basePriceForRank(config: PricingConfig, rank: number): number {
  const n = Math.max(1, Math.floor(rank));
  return roundCurrency(config.startingPrice * Math.pow(1 + config.growthRate, n - 1));
}

/** Final price for a specific spot: base price at its rank, times its tier multiplier. This is the amount actually charged. */
export function priceForSpot(config: PricingConfig, rank: number, tier: SpotTier): number {
  return roundCurrency(basePriceForRank(config, rank) * TIER_MULTIPLIERS[tier]);
}

/** The base price the NEXT spot to sell (whatever tier it turns out to be) will use. */
export function getCurrentBasePrice(config: PricingConfig, spots: Spot[]): number {
  return basePriceForRank(config, getClaimedSpots(spots).length + 1);
}

/** The base price the spot AFTER that will use, once the current one sells. */
export function getNextBasePrice(config: PricingConfig, spots: Spot[]): number {
  return basePriceForRank(config, getClaimedSpots(spots).length + 2);
}

export interface RankedPriceLine {
  spotId: number;
  tier: SpotTier;
  purchaseRank: number;
  unitBasePrice: number;
  tierMultiplier: number;
  finalPrice: number;
}

/**
 * Prices a set of spots being claimed together in one checkout. Every
 * spot consumes its own sequential rank off the SAME global counter (spot
 * 1 gets rank 80, spot 2 gets rank 81, ...) - there is no per-tier
 * sequence and no frozen "checkout price" applied to every item. This is
 * the exact breakdown the checkout panel renders.
 */
export function priceSelection(config: PricingConfig, spots: Spot[], selectedSpotIds: number[]): RankedPriceLine[] {
  const startRank = getClaimedSpots(spots).length + 1;
  const byId = new Map(spots.map((s) => [s.id, s]));
  return selectedSpotIds.map((spotId, index) => {
    const spot = byId.get(spotId);
    const tier = spot?.tier ?? "standard";
    const rank = startRank + index;
    const unitBasePrice = basePriceForRank(config, rank);
    const tierMultiplier = TIER_MULTIPLIERS[tier];
    return {
      spotId,
      tier,
      purchaseRank: rank,
      unitBasePrice,
      tierMultiplier,
      finalPrice: roundCurrency(unitBasePrice * tierMultiplier),
    };
  });
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
