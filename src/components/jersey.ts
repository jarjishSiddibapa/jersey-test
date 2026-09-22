import type { Spot } from "../types";
import { escapeHtml, initialsOf } from "../utils/formatting";
import { JERSEY_VIEWBOX } from "../data/spots";

// Jersey silhouette: crew collar, capped sleeves, slightly flared hem.
// Coordinates share the 1000x700 space that spot geometry is defined in.
const JERSEY_PATH = [
  "M 262,62",
  "L 440,20",
  "Q 500,0 560,20",
  "L 738,62",
  "L 900,112",
  "L 900,270",
  "L 762,232",
  "L 790,608",
  "Q 780,648 748,648",
  "L 252,648",
  "Q 220,648 210,608",
  "L 238,232",
  "L 100,270",
  "L 100,112",
  "Z",
].join(" ");

// Traces the exact top-collar curve of JERSEY_PATH so the ribbing sits
// flush against the neckline instead of floating as a separate shape.
const COLLAR_PATH = "M 440,20 Q 500,0 560,20";

function spotRadius(spot: Spot): number {
  return Math.min(6, Math.round(Math.min(spot.width, spot.height) * 0.12));
}

function renderLogoOrBadge(spot: Spot): string {
  if (spot.logoUrl) {
    const pad = Math.min(spot.width, spot.height) * 0.12;
    return `<image
        href="${spot.logoUrl}"
        x="${spot.x + pad}"
        y="${spot.y + pad}"
        width="${spot.width - pad * 2}"
        height="${spot.height - pad * 2}"
        preserveAspectRatio="xMidYMid meet"
      />`;
  }
  const name = spot.buyerName ?? "";
  const fontSize = clampFontSize(spot);
  const label = spot.width < 46 ? initialsOf(name) : truncateForWidth(name, spot.width, fontSize);
  return `<text
      x="${spot.x + spot.width / 2}"
      y="${spot.y + spot.height / 2}"
      class="jersey-spot-label"
      font-size="${fontSize}"
      text-anchor="middle"
      dominant-baseline="central"
    >${escapeHtml(label)}</text>`;
}

function clampFontSize(spot: Spot): number {
  const base = Math.min(spot.width, spot.height) * 0.26;
  return Math.max(11, Math.min(22, Math.round(base)));
}

function truncateForWidth(name: string, width: number, fontSize: number): string {
  const approxCharWidth = fontSize * 0.62;
  const maxChars = Math.max(2, Math.floor(width / approxCharWidth));
  if (name.length <= maxChars) return name;
  return `${name.slice(0, Math.max(1, maxChars - 1))}…`;
}

export interface JerseyRenderOptions {
  highlightedIds?: Set<number>;
  dimUnhighlighted?: boolean;
  selectionMode?: boolean;
  selectedSpotId?: number | null;
  justClaimedSpotId?: number | null;
  idPrefix?: string;
}

export function renderJerseySvg(spots: Spot[], options: JerseyRenderOptions = {}): string {
  const {
    highlightedIds,
    dimUnhighlighted,
    selectionMode,
    selectedSpotId,
    justClaimedSpotId,
    idPrefix = "j",
  } = options;
  const clipId = `${idPrefix}-jersey-clip`;

  const spotNodes = spots
    .map((spot) => {
      const classes = ["jersey-spot", `jersey-spot--${spot.status}`, `jersey-spot--${spot.region}`];
      if (selectionMode && spot.status === "available") classes.push("jersey-spot--selectable");
      if (selectedSpotId === spot.id) classes.push("jersey-spot--selected");
      if (justClaimedSpotId === spot.id) classes.push("jersey-spot--just-claimed");
      if (highlightedIds) {
        classes.push(highlightedIds.has(spot.id) ? "jersey-spot--match" : "jersey-spot--nomatch");
      } else if (dimUnhighlighted) {
        classes.push("jersey-spot--nomatch");
      }

      const r = spotRadius(spot);
      const rect = `<rect
          x="${spot.x}" y="${spot.y}" width="${spot.width}" height="${spot.height}" rx="${r}"
          class="jersey-spot-shape"
        />`;
      const content = spot.status === "claimed" ? renderLogoOrBadge(spot) : "";

      return `<g class="${classes.join(" ")}" data-spot-id="${spot.id}" tabindex="0" role="button"
          aria-label="${spot.status === "claimed" ? `Spot ${spot.id}, claimed by ${escapeHtml(spot.buyerName ?? "")}` : `Spot ${spot.id}, available`}">
          ${rect}
          ${content}
        </g>`;
    })
    .join("");

  const gradientId = `${idPrefix}-jersey-gradient`;

  return `<svg
      class="jersey-svg"
      viewBox="0 0 ${JERSEY_VIEWBOX.width} ${JERSEY_VIEWBOX.height}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="The Internet Jersey"
    >
      <defs>
        <clipPath id="${clipId}">
          <path d="${JERSEY_PATH}" />
        </clipPath>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#24262a" />
          <stop offset="55%" stop-color="#18191c" />
          <stop offset="100%" stop-color="#0f1011" />
        </linearGradient>
      </defs>
      <path d="${JERSEY_PATH}" fill="url(#${gradientId})" />
      <g clip-path="url(#${clipId})">
        <line x1="762" y1="232" x2="790" y2="608" class="jersey-seam" />
        <line x1="238" y1="232" x2="210" y2="608" class="jersey-seam" />
        <line x1="304" y1="136" x2="696" y2="136" class="jersey-yoke" />
        <rect x="100" y="598" width="800" height="18" class="jersey-hem-stripe" />
      </g>
      <path d="${JERSEY_PATH}" class="jersey-outline" />
      <path d="${COLLAR_PATH}" class="jersey-collar" />
      <text x="500" y="600" class="jersey-number" text-anchor="middle">01</text>
      <text x="792" y="90" class="jersey-mark" text-anchor="start">IJ</text>
      <g class="jersey-spots">${spotNodes}</g>
    </svg>`;
}
