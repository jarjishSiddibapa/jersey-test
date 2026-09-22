import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSpots, TOTAL_SPOTS, TIER_COUNTS, JERSEY_VIEWBOX } from "./spots";

// Rectangular safe zones a spot's tier/region box is known to sit inside
// (see the comment in spots.ts) - a stand-in for the browser-only
// SVGPathElement.isPointInFill silhouette check, so this still catches a
// region box that regresses outside the garment even in a plain Node
// test with no DOM available.
// x/y bounds are the TRUE silhouette limits (seam x-coordinates 285/715,
// underarm-to-hem y-range 205/780; raglan band x172-828, y118-198) - not
// the tighter, deliberately-margined boxes spots.ts actually places
// spots within. A generated spot only needs to stay inside the real
// garment; it's fine (and expected, from mosaic rounding) for it to
// occasionally touch the edge of its own region's self-imposed margin.
const SAFE_ZONES: { region: string; x0: number; y0: number; x1: number; y1: number }[] = [
  { region: "shoulder", x0: 172, y0: 118, x1: 828, y1: 198 },
  { region: "sleeve", x0: 172, y0: 118, x1: 828, y1: 198 },
  { region: "chest", x0: 285, y0: 205, x1: 715, y1: 780 },
  { region: "lower", x0: 285, y0: 205, x1: 715, y1: 780 },
];

test("generateSpots produces exactly 200 spots", () => {
  assert.equal(generateSpots().length, 200);
  assert.equal(TOTAL_SPOTS, 200);
});

test("spot IDs are unique, sequential, and 1..200", () => {
  const spots = generateSpots();
  assert.deepEqual(
    spots.map((s) => s.id),
    Array.from({ length: 200 }, (_, i) => i + 1),
  );
});

test("tier split is exactly 160 standard / 28 premium / 12 hero", () => {
  const spots = generateSpots();
  const counts = { standard: 0, premium: 0, hero: 0 };
  for (const s of spots) counts[s.tier]++;
  assert.deepEqual(counts, { standard: 160, premium: 28, hero: 12 });
  assert.deepEqual(TIER_COUNTS, { standard: 160, premium: 28, hero: 12 });
});

test("no two spots share the same coordinates (no overlap bug)", () => {
  const spots = generateSpots();
  const keys = new Set(spots.map((s) => `${s.x},${s.y}`));
  assert.equal(keys.size, spots.length);
});

test("every spot sits inside a known-safe silhouette zone for its region", () => {
  const spots = generateSpots();
  for (const spot of spots) {
    const zone = SAFE_ZONES.find((z) => z.region === spot.region);
    assert.ok(zone, `no safe zone defined for region ${spot.region}`);
    assert.ok(
      spot.x >= zone!.x0 && spot.y >= zone!.y0 && spot.x + spot.width <= zone!.x1 && spot.y + spot.height <= zone!.y1,
      `spot #${spot.id} (${spot.x},${spot.y},${spot.width}x${spot.height}) escapes its safe zone`,
    );
    // also sanity-check it's within the jersey's own canvas
    assert.ok(spot.x >= 0 && spot.y >= 0);
    assert.ok(spot.x + spot.width <= JERSEY_VIEWBOX.width);
    assert.ok(spot.y + spot.height <= JERSEY_VIEWBOX.height);
  }
});

test("generateSpots is deterministic", () => {
  const a = generateSpots("e");
  const b = generateSpots("e");
  assert.deepEqual(a, b);
});
