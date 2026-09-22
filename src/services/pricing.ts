import type { PricingConfig, Spot } from "../types";

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  basePrice: 0.01,
  // A gentle daily compounding rate (not a doubling) so the price stays
  // interesting for months instead of hitting the cap in under 3 weeks.
  // ~8%/day roughly doubles every 9 days and reaches the $2,500 cap
  // around day 160.
  growthMultiplier: 1.08,
  pricingInterval: 24 * 60 * 60 * 1000,
  maximumPrice: null,
  currency: "USD",
  projectStartDate: new Date().toISOString(),
};

/** Day 1 is the first day of the project. Returns the natural (real-time) day number. */
export function getNaturalDay(config: PricingConfig, now: number): number {
  const start = new Date(config.projectStartDate).getTime();
  const elapsed = Math.max(0, now - start);
  return Math.floor(elapsed / config.pricingInterval) + 1;
}

/** Effective current day, honoring a prototype demo-day override when present. */
export function getCurrentDay(
  config: PricingConfig,
  now: number,
  demoDayOverride: number | null,
): number {
  if (demoDayOverride !== null) return demoDayOverride;
  return getNaturalDay(config, now);
}

export function getPriceForDay(config: PricingConfig, day: number): number {
  const raw = config.basePrice * Math.pow(config.growthMultiplier, day - 1);
  // Rounding to whole cents would hide several days of gentle compounding
  // (1.08x/day doesn't clear a full cent for about a week) - round to a
  // finer step instead so the price still visibly moves day to day.
  const rounded = Math.round(raw * 10000) / 10000;
  if (config.maximumPrice !== null) return Math.min(rounded, config.maximumPrice);
  return rounded;
}

export function getCurrentPrice(
  config: PricingConfig,
  now: number,
  demoDayOverride: number | null,
): number {
  return getPriceForDay(config, getCurrentDay(config, now, demoDayOverride));
}

export function getNextPrice(
  config: PricingConfig,
  now: number,
  demoDayOverride: number | null,
): number {
  return getPriceForDay(config, getCurrentDay(config, now, demoDayOverride) + 1);
}

/**
 * Milliseconds remaining in the current real-time pricing interval.
 * Always derived from wall-clock time and the configured interval so the
 * countdown is live and truthful, independent of any demo-day override.
 */
export function getTimeUntilNextIncrease(config: PricingConfig, now: number): number {
  const start = new Date(config.projectStartDate).getTime();
  const elapsed = Math.max(0, now - start);
  const intoInterval = elapsed % config.pricingInterval;
  return config.pricingInterval - intoInterval;
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
