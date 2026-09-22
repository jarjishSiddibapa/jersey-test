import { test } from "node:test";
import assert from "node:assert/strict";
import { basePriceForRank, priceForSpot, priceSelection, DEFAULT_PRICING_CONFIG } from "./pricing";
import type { Spot } from "../types";

// Expected values from the product spec (section 7): startingPrice=0.10,
// growthRate=0.06, priceForRank(n) = 0.10 * 1.06^(n-1). Spec gives
// "approximately" figures, so this tolerates a small relative error
// rather than demanding bit-exact equality.
function assertClose(actual: number, expected: number, relTolerance = 0.02): void {
  const diff = Math.abs(actual - expected) / expected;
  assert.ok(diff <= relTolerance, `expected ~${expected}, got ${actual} (${(diff * 100).toFixed(2)}% off)`);
}

test("basePriceForRank matches the spec's worked examples", () => {
  const cfg = DEFAULT_PRICING_CONFIG;
  assertClose(basePriceForRank(cfg, 1), 0.1);
  assertClose(basePriceForRank(cfg, 25), 0.4);
  assertClose(basePriceForRank(cfg, 50), 1.74);
  assertClose(basePriceForRank(cfg, 75), 7.46);
  assertClose(basePriceForRank(cfg, 100), 32.01);
  assertClose(basePriceForRank(cfg, 125), 137.38);
  assertClose(basePriceForRank(cfg, 150), 589.62);
  assertClose(basePriceForRank(cfg, 175), 2530.58);
  assertClose(basePriceForRank(cfg, 200), 10860.93);
});

test("basePriceForRank has no artificial ceiling", () => {
  const cfg = DEFAULT_PRICING_CONFIG;
  // rank 300 keeps compounding rather than clamping to some cap.
  const far = basePriceForRank(cfg, 300);
  assert.ok(far > basePriceForRank(cfg, 200) * 100, "price should keep growing well past rank 200");
});

test("priceForSpot applies the exact tier multipliers", () => {
  const cfg = { startingPrice: 100, growthRate: 0, currency: "USD" }; // base pinned at 100 for every rank
  assert.equal(priceForSpot(cfg, 1, "standard"), 100);
  assert.equal(priceForSpot(cfg, 1, "premium"), 300);
  assert.equal(priceForSpot(cfg, 1, "hero"), 500);
});

test("priceSelection consumes sequential ranks off ONE global counter, not per tier", () => {
  const cfg = DEFAULT_PRICING_CONFIG;
  const spots: Spot[] = [
    { id: 80, editionId: "e", x: 0, y: 0, width: 1, height: 1, region: "chest", tier: "standard", status: "available" },
    { id: 81, editionId: "e", x: 0, y: 0, width: 1, height: 1, region: "chest", tier: "premium", status: "available" },
    { id: 82, editionId: "e", x: 0, y: 0, width: 1, height: 1, region: "chest", tier: "standard", status: "available" },
  ];
  // pretend 79 spots are already claimed, so the next rank is 80
  const claimedPadding: Spot[] = Array.from({ length: 79 }, (_, i) => ({
    id: 1000 + i,
    editionId: "e",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    region: "chest",
    tier: "standard",
    status: "claimed",
  }));

  const lines = priceSelection(cfg, [...claimedPadding, ...spots], [80, 81, 82]);
  assert.deepEqual(
    lines.map((l) => l.purchaseRank),
    [80, 81, 82],
  );
  assert.equal(lines[1].tierMultiplier, 3);
  assert.equal(lines[0].tierMultiplier, 1);
  // each line's final price = that rank's base price * its own tier multiplier
  for (const line of lines) {
    assertClose(line.finalPrice, basePriceForRank(cfg, line.purchaseRank) * line.tierMultiplier, 0.0001);
  }
});
