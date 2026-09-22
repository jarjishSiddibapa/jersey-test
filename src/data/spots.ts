import type { Spot, SpotRegion } from "../types";

/**
 * Jersey artwork coordinate system: 0-1000 wide, 0-850 tall - a real
 * short-sleeve jersey proportion (torso only modestly taller than it is
 * wide, like an actual garment product photo), not the elongated
 * robe-like 1000x1150 box this used to be. Kept in sync with the
 * silhouette path drawn in components/jersey.ts.
 */
export const JERSEY_VIEWBOX = { width: 1000, height: 850 };

interface RegionBounds {
  region: SpotRegion;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  count: number;
}

// Bounding boxes sit safely inside the jersey silhouette (see jersey.ts),
// each with a verified margin so the mosaic never crosses the collar,
// shoulder, underarm or hem edges. The shoulder/sleeve band lives in the
// y=118-198 zone, which is the full raglan-width span (160-840) before
// the underarm cut starts narrowing the shape at y=205. The chest/lower
// regions sit inside the constant-width torso column (285-715), and the
// lower region stops well above the hem stripe.
const REGIONS: RegionBounds[] = [
  { region: "shoulder", x0: 302, y0: 118, x1: 462, y1: 198, count: 16 },
  { region: "shoulder", x0: 538, y0: 118, x1: 698, y1: 198, count: 16 },
  { region: "sleeve", x0: 172, y0: 118, x1: 272, y1: 198, count: 16 },
  { region: "sleeve", x0: 728, y0: 118, x1: 828, y1: 198, count: 16 },
  { region: "chest", x0: 305, y0: 225, x1: 695, y1: 470, count: 110 },
  { region: "lower", x0: 305, y0: 490, x1: 695, y1: 758, count: 126 },
];

const GAP = 6;

/**
 * Tiles a region into a brick-like mosaic of rects. Row counts are varied
 * (+/- 1 cell) so rows are staggered rather than forming a uniform grid,
 * giving the jersey a patchwork look instead of a spreadsheet grid.
 */
function generateMosaic(bounds: RegionBounds): Omit<Spot, "id" | "status">[] {
  const { x0, y0, x1, y1, count, region } = bounds;
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

  const results: Omit<Spot, "id" | "status">[] = [];
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
      });
    }
  }

  return results;
}

export function generateSpots(): Spot[] {
  let id = 1;
  const spots: Spot[] = [];

  for (const region of REGIONS) {
    const rects = generateMosaic(region);
    for (const rect of rects) {
      spots.push({
        id: id++,
        status: "available",
        ...rect,
      });
    }
  }

  return spots;
}

export const TOTAL_SPOTS = REGIONS.reduce((sum, r) => sum + r.count, 0);
