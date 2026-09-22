import type { Spot, SpotRegion } from "../types";

/**
 * Jersey artwork coordinate system: 0-1000 wide, 0-700 tall.
 * Kept in sync with the silhouette path drawn in components/jersey.ts.
 */
export const JERSEY_VIEWBOX = { width: 1000, height: 700 };

interface RegionBounds {
  region: SpotRegion;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  count: number;
}

// Bounding boxes sit safely inside the jersey silhouette (see jersey.ts),
// leaving margin so the mosaic never crosses collar, armpit or hem edges.
const REGIONS: RegionBounds[] = [
  { region: "shoulder", x0: 262, y0: 62, x1: 378, y1: 128, count: 15 },
  { region: "shoulder", x0: 622, y0: 62, x1: 738, y1: 128, count: 15 },
  { region: "sleeve", x0: 112, y0: 112, x1: 248, y1: 258, count: 25 },
  { region: "sleeve", x0: 752, y0: 112, x1: 888, y1: 258, count: 25 },
  { region: "chest", x0: 302, y0: 142, x1: 698, y1: 372, count: 110 },
  { region: "lower", x0: 262, y0: 382, x1: 738, y1: 618, count: 110 },
];

const GAP = 9;

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
