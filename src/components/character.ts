import type { Spot } from "../types";
import { renderJerseySvg, type JerseyRenderOptions } from "./jersey";
import { JERSEY_VIEWBOX } from "../data/spots";

/**
 * A faceless, silhouette-only mascot wearing the jersey. The jersey is
 * nested as its own <svg> so it keeps the 0-1000x0-700 coordinate system
 * spot geometry is authored in, regardless of the character's own scale.
 */
export function renderCharacterSvg(spots: Spot[], options: JerseyRenderOptions = {}): string {
  const jerseyTop = 160;
  const jerseySvg = renderJerseySvg(spots, { idPrefix: "char", ...options });

  return `<svg
      class="character-svg"
      viewBox="0 0 1000 1240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Faceless mascot wearing the jersey"
    >
      <ellipse cx="500" cy="1195" rx="230" ry="22" class="character-shadow" />

      <g class="character-legs">
        <rect x="368" y="900" width="72" height="210" rx="30" class="character-leg" />
        <rect x="560" y="900" width="72" height="210" rx="30" class="character-leg" />
      </g>

      <g class="character-shoes">
        <rect x="340" y="1098" width="130" height="46" rx="20" class="character-shoe" />
        <rect x="530" y="1098" width="130" height="46" rx="20" class="character-shoe" />
        <rect x="340" y="1124" width="130" height="13" rx="6.5" class="character-shoe-sole" />
        <rect x="530" y="1124" width="130" height="13" rx="6.5" class="character-shoe-sole" />
      </g>

      <path
        d="M 328,776 L 672,776 L 648,918 Q 500,946 352,918 Z"
        class="character-shorts"
      />

      <rect x="470" y="112" width="60" height="78" rx="6" class="character-neck" />

      <svg
        x="0" y="${jerseyTop}"
        width="1000" height="${JERSEY_VIEWBOX.height}"
        viewBox="0 0 ${JERSEY_VIEWBOX.width} ${JERSEY_VIEWBOX.height}"
      >
        ${jerseySvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}
      </svg>

      <circle cx="500" cy="66" r="66" class="character-head" />
    </svg>`;
}
