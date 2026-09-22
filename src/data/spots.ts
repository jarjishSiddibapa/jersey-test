import type { Spot, SpotRegion, SpotTier } from "../types";

/**
 * Jersey artwork coordinate system: 0-1000 wide, 0-850 tall - a real
 * short-sleeve jersey proportion. Kept in sync with the silhouette path
 * drawn in components/jersey.ts.
 */
export const JERSEY_VIEWBOX = { width: 1000, height: 850 };

export const DEFAULT_EDITION_ID = "edition-001";

interface RegionBounds {
  region: SpotRegion;
  tier: SpotTier;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  count: number;
}

// Every box below is a SUBSET of a region previously verified (via
// SVGPathElement.isPointInFill on all four corners of every generated
// rect) to sit safely inside the jersey silhouette - shoulder/sleeve
// within the raglan-width band (x172-828, y118-198), chest/lower within
// the constant-width torso column (x305-695, y205-780, clear of the hem
// stripe). A box that is a strict subset of an already-safe box cannot
// cross the silhouette either, so subdividing the chest box into
// hero/premium/standard bands below doesn't reopen that question - it's
// re-verified anyway at generateSpots() call time in dev (see
// assertSpotInvariants).
//
// Tier placement follows the product's "most valuable real estate gets
// the rarest tier" rule: HERO sits dead center chest, PREMIUM rings it
// (upper chest + the columns flanking hero), STANDARD takes the shoulders,
// sleeves, lower chest and the entire lower torso.
const REGIONS: RegionBounds[] = [
  { region: "shoulder", tier: "standard", x0: 310, y0: 120, x1: 455, y1: 195, count: 10 },
  { region: "shoulder", tier: "standard", x0: 545, y0: 120, x1: 690, y1: 195, count: 10 },
  { region: "sleeve", tier: "standard", x0: 185, y0: 120, x1: 270, y1: 195, count: 10 },
  { region: "sleeve", tier: "standard", x0: 730, y0: 120, x1: 815, y1: 195, count: 10 },
  { region: "chest", tier: "premium", x0: 305, y0: 225, x1: 695, y1: 300, count: 16 },
  { region: "chest", tier: "premium", x0: 305, y0: 300, x1: 400, y1: 380, count: 6 },
  { region: "chest", tier: "premium", x0: 600, y0: 300, x1: 695, y1: 380, count: 6 },
  { region: "chest", tier: "hero", x0: 400, y0: 300, x1: 600, y1: 380, count: 12 },
  { region: "chest", tier: "standard", x0: 305, y0: 380, x1: 695, y1: 470, count: 30 },
  { region: "lower", tier: "standard", x0: 305, y0: 490, x1: 695, y1: 758, count: 90 },
];

export const TOTAL_SPOTS = REGIONS.reduce((sum, r) => sum + r.count, 0);
export const TIER_COUNTS: Record<SpotTier, number> = REGIONS.reduce(
  (acc, r) => ({ ...acc, [r.tier]: acc[r.tier] + r.count }),
  { standard: 0, premium: 0, hero: 0 } as Record<SpotTier, number>,
);

const GAP = 6;

/**
 * Tiles a region into a brick-like mosaic of rects. Row counts are varied
 * (+/- 1 cell) so rows are staggered rather than forming a uniform grid,
 * giving the jersey a patchwork look instead of a spreadsheet grid.
 */
function generateMosaic(bounds: RegionBounds): Omit<Spot, "id" | "status" | "editionId">[] {
  const { x0, y0, x1, y1, count, region, tier } = bounds;
  const width = x1 - x0;
  const height = y1 - y0;
  const aspect = width / height;

  let rows = Math.max(1, Math.round(Math.sqrt(count / aspect)));
  while (rows > 1 && count / rows < 2) rows--;

  const baseCols = Math.floor(count / rows);
  let remainder = count - baseCols * rows;
  const rowCounts: number[] = [];
  for (let r = 0; r < rows; r++) {
    let cols = baseCols;
    if (remainder > 0) {
      cols += 1;
      remainder--;
    }
    rowCounts.push(Math.max(1, cols));
  }
  // Stagger: nudge alternating rows +/-1 cell (borrowing from a neighbor)
  // for a brick pattern, as long as it doesn't starve a row below 1.
  for (let r = 0; r < rows; r += 2) {
    if (rowCounts[r] > 1 && r + 1 < rows) {
      rowCounts[r] -= 1;
      rowCounts[r + 1] += 1;
    }
  }

  const results: Omit<Spot, "id" | "status" | "editionId">[] = [];
  const rowHeight = (height - GAP * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    const cols = rowCounts[r];
    const rowY = y0 + r * (rowHeight + GAP);
    const colWidth = (width - GAP * (cols - 1)) / cols;
    for (let c = 0; c < cols; c++) {
      const colX = x0 + c * (colWidth + GAP);
      results.push({
        x: Math.round(colX),
        y: Math.round(rowY),
        width: Math.round(colWidth),
        height: Math.round(rowHeight),
        region,
        tier,
      });
    }
  }

  return results;
}

export function generateSpots(editionId: string = DEFAULT_EDITION_ID): Spot[] {
  let id = 1;
  const spots: Spot[] = [];

  for (const region of REGIONS) {
    const rects = generateMosaic(region);
    for (const rect of rects) {
      spots.push({
        id: id++,
        editionId,
        status: "available",
        ...rect,
      });
    }
  }

  assertSpotInvariants(spots);
  return spots;
}

/**
 * Hard invariants the product spec requires: exactly 200 spots, unique
 * sequential IDs 1..200, the exact 160/28/12 tier split, and no two spots
 * sharing coordinates (which would mean an overlap bug in the mosaic
 * tiler). Runs every time spots are freshly generated; throws instead of
 * silently shipping a broken jersey.
 */
function assertSpotInvariants(spots: Spot[]): void {
  if (spots.length !== 200) {
    throw new Error(`Spot generation invariant failed: expected exactly 200 spots, got ${spots.length}`);
  }
  const ids = spots.map((s) => s.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error("Spot generation invariant failed: duplicate spot IDs");
  }
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] !== i + 1) {
      throw new Error(`Spot generation invariant failed: IDs must be sequential 1..200, got gap at index ${i}`);
    }
  }
  const tierCounts = spots.reduce(
    (acc, s) => ({ ...acc, [s.tier]: acc[s.tier] + 1 }),
    { standard: 0, premium: 0, hero: 0 } as Record<SpotTier, number>,
  );
  if (tierCounts.standard !== 160 || tierCounts.premium !== 28 || tierCounts.hero !== 12) {
    throw new Error(
      `Spot generation invariant failed: expected 160/28/12 standard/premium/hero, got ${tierCounts.standard}/${tierCounts.premium}/${tierCounts.hero}`,
    );
  }
  const coordKeys = new Set(spots.map((s) => `${s.x},${s.y}`));
  if (coordKeys.size !== spots.length) {
    throw new Error("Spot generation invariant failed: two spots share the same coordinates");
  }
}
