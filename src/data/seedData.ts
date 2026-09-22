import type { ActivityEntry, PricingConfig, Spot } from "../types";
import { getPriceForDay } from "../services/pricing";
import { minutesAgoIso } from "../utils/dates";

export const DEMO_BUYER_NAMES = [
  "Nova",
  "PixelForge",
  "Mango Labs",
  "Build Club",
  "DevHouse",
  "Rafi",
  "CodeFuel",
  "Studio 17",
  "Northstar",
  "Orbit",
  "SneakerDad",
  "BuildWithMe",
  "RDC Labs",
  "Alex",
  "Kite & Co",
  "Fernweh",
  "Loop Studio",
  "Maya",
  "Greyscale",
  "Basecamp Kids",
  "Turntable",
  "Halide",
  "Driftwood",
  "Ilya",
  "Paper Plane",
  "Fieldnotes",
  "Quiet Room",
  "Twelve",
  "Sana",
  "Warmline",
  "Outpost",
  "Kilo",
  "Tomas",
  "Brightside",
  "Foundry",
  "Juno Labs",
  "Priya",
  "Tinker",
  "Common Room",
  "Waveform",
  "Ezra",
  "Palette Co",
  "Lowkey",
  "Signal House",
  "Dara",
  "Anchorpoint",
  "Freeform",
  "Little Big",
  "Yuki",
  "Hollow Studio",
  "Gridline",
  "Restless",
  "Marlowe",
  "Fixture",
  "Nine Lives",
  "Otto",
  "Slowdown",
  "Keystone",
  "Vantage",
  "Wren",
];

const DEMO_WEBSITES = new Set([
  "Nova",
  "PixelForge",
  "Mango Labs",
  "DevHouse",
  "CodeFuel",
  "Studio 17",
  "Northstar",
  "RDC Labs",
  "Loop Studio",
  "Foundry",
  "Juno Labs",
  "Common Room",
  "Signal House",
]);

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export interface SeedResult {
  spots: Spot[];
  activity: ActivityEntry[];
}

/**
 * Fills `count` available spots with demo buyers so the jersey looks
 * populated. Deterministic per call via `seed` so results are reproducible
 * within a session but can be varied by the caller (e.g. Date.now()).
 */
export function seedDemoBuyers(
  spots: Spot[],
  count: number,
  config: PricingConfig,
  currentDay: number,
  seed: number = 42,
): SeedResult {
  const rng = mulberry32(seed);
  const available = spots.filter((s) => s.status === "available");
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const targets = shuffled.slice(0, Math.min(count, shuffled.length));
  const nextSpots = [...spots];
  const activity: ActivityEntry[] = [];
  const usedNames: string[] = [];

  targets.forEach((target, index) => {
    const name = DEMO_BUYER_NAMES[Math.floor(rng() * DEMO_BUYER_NAMES.length)];
    usedNames.push(name);
    const day = 1 + Math.floor(rng() * rng() * currentDay);
    const boundedDay = Math.min(Math.max(day, 1), currentDay);
    const price = getPriceForDay(config, boundedDay);
    const minutesAgo = Math.floor(rng() * 60 * 24 * 6) + index;
    const purchasedAt = minutesAgoIso(minutesAgo);
    const hasWebsite = DEMO_WEBSITES.has(name);

    const idx = nextSpots.findIndex((s) => s.id === target.id);
    nextSpots[idx] = {
      ...nextSpots[idx],
      status: "claimed",
      buyerName: name,
      website: hasWebsite ? `${slugify(name)}.co` : undefined,
      pricePaid: price,
      purchaseDay: boundedDay,
      purchasedAt,
      isDemo: true,
    };

    activity.push({
      id: `demo-${target.id}-${index}`,
      spotId: target.id,
      buyerName: name,
      pricePaid: price,
      timestamp: purchasedAt,
      isDemo: true,
    });
  });

  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { spots: nextSpots, activity };
}
