import type { Buyer, Order, OrderItem, PendingClaim, PricingConfig, Spot } from "../types";
import { priceSelection } from "./pricing";

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildBuyer(claim: PendingClaim, now: number = Date.now()): Buyer {
  return {
    id: makeId("buyer"),
    name: claim.buyerName.trim(),
    company: claim.company.trim() || undefined,
    email: claim.email.trim(),
    website: claim.website.trim() || undefined,
    createdAt: new Date(now).toISOString(),
  };
}

/**
 * Builds the order a checkout is about to charge, using the SAME pricing
 * function the price breakdown UI reads from - so what the buyer is
 * shown is exactly what gets charged and exactly what gets persisted as
 * order history. A real backend would redo this calculation itself from
 * the authoritative current rank rather than trust anything the client
 * sends (see README "authoritative server state").
 */
export function buildOrder(
  config: PricingConfig,
  spots: Spot[],
  editionId: string,
  buyerId: string,
  selectedSpotIds: number[],
  now: number = Date.now(),
): Order {
  const lines = priceSelection(config, spots, selectedSpotIds);
  const items: OrderItem[] = lines.map((line) => ({
    spotId: line.spotId,
    purchaseRank: line.purchaseRank,
    tier: line.tier,
    unitBasePrice: line.unitBasePrice,
    tierMultiplier: line.tierMultiplier,
    finalPrice: line.finalPrice,
  }));
  const amount = Math.round(items.reduce((sum, item) => sum + item.finalPrice, 0) * 1e6) / 1e6;

  return {
    id: makeId("order"),
    editionId,
    buyerId,
    items,
    amount,
    currency: config.currency,
    paymentProvider: "mock",
    paymentId: null,
    status: "pending",
    createdAt: new Date(now).toISOString(),
    paidAt: null,
    refundedAt: null,
  };
}
