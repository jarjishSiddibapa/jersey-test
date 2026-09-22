import type { Spot } from "../types";
import { renderJerseyInner, type JerseyRenderOptions } from "./jersey";
import { JERSEY_VIEWBOX } from "../data/spots";

/**
 * Faceless stylized mascot wearing the jersey, for the hero only. The
 * jersey itself (silhouette, seams, spots) is reused unmodified from
 * jersey.ts via renderJerseyInner and placed inside this bigger canvas
 * with a <g transform="translate(...)"> - not redrawn with hand-copied
 * coordinates. That's deliberate: an earlier version of this character
 * duplicated the jersey's collar/hem numbers by hand, and the tiniest
 * drift between the two copies produced a gap at the neck and another at
 * the waist. Sharing one source of truth for those coordinates makes
 * that class of bug impossible - the head/neck and legs/shoes only need
 * to overlap generously into the jersey's own painted area (they're
 * drawn first, the jersey paints over the seam), not match it exactly.
 */
const HEAD_SPACE = 140;
const LEG_SPACE = 270;
const CHAR_WIDTH = JERSEY_VIEWBOX.width;
const CHAR_HEIGHT = HEAD_SPACE + JERSEY_VIEWBOX.height + LEG_SPACE;

export function renderCharacterSvg(spots: Spot[], options: JerseyRenderOptions = {}): string {
  const idPrefix = options.idPrefix ?? "j";

  return `<svg
      class="character-svg"
      viewBox="0 0 ${CHAR_WIDTH} ${CHAR_HEIGHT}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A faceless character wearing the jersey"
    >
      <circle class="character-head" cx="500" cy="70" r="58" />
      <rect class="character-neck" x="465" y="95" width="70" height="90" rx="10" />

      <rect class="character-shorts" x="285" y="890" width="430" height="110" rx="26" />
      <rect class="character-leg" x="330" y="970" width="150" height="180" rx="20" />
      <rect class="character-leg" x="520" y="970" width="150" height="180" rx="20" />
      <g class="character-shoe">
        <rect x="300" y="1148" width="210" height="58" rx="26" />
        <rect class="character-shoe-sole" x="300" y="1184" width="210" height="12" rx="6" />
      </g>
      <g class="character-shoe">
        <rect x="490" y="1148" width="210" height="58" rx="26" />
        <rect class="character-shoe-sole" x="490" y="1184" width="210" height="12" rx="6" />
      </g>

      <g transform="translate(0, ${HEAD_SPACE})">${renderJerseyInner(spots, { ...options, idPrefix })}</g>
    </svg>`;
}
