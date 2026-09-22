import type { AppState } from "../types";
import { renderPriceCard } from "./priceCard";
import { renderCharacterSvg } from "./character";
import { FOUNDING_SPOT_THRESHOLD, getClaimedSpots, getRemainingSpotCount } from "../services/pricing";

export function renderHero(state: AppState): string {
  const remaining = getRemainingSpotCount(state.spots);
  const soldOut = remaining === 0;
  const claimed = getClaimedSpots(state.spots).length;

  const eyebrow = soldOut
    ? "The jersey is full"
    : claimed < FOUNDING_SPOT_THRESHOLD
      ? "Founding spots are live"
      : "One jersey. Limited spots. Rising prices.";

  const actions = soldOut
    ? `<div class="hero__actions">
        <button class="btn btn-ghost" data-action="explore-jersey">Explore the jersey</button>
      </div>`
    : `<div class="hero__actions">
        <button class="btn btn-accent" data-action="start-claim">Claim your spot</button>
        <button class="btn btn-ghost" data-action="explore-jersey">Explore the jersey</button>
      </div>`;

  return `
    <section class="hero" id="top">
      <div class="container">
        <div class="hero__stage">
          <div class="hero__glow" aria-hidden="true"></div>
          ${renderCharacterSvg(state.spots, {
            idPrefix: "hero",
            selectionMode: false,
            selectedSpotId: state.selectedSpotId,
            justClaimedSpotId: state.lastPurchasedSpotId,
          })}
        </div>

        <div class="hero__copy">
          <p class="hero__eyebrow"><span class="live-dot"></span> ${eyebrow}</p>
          <h1 class="hero__title">${
            soldOut ? "Every spot has been claimed." : "Own a tiny piece of the internet."
          }</h1>
          <p class="hero__subtitle">
            ${
              soldOut
                ? "Every spot on this jersey is taken. Explore who's on it."
                : "Claim a spot before the next one costs more."
            }
          </p>
          ${actions}
        </div>

        <div class="hero__price">
          ${renderPriceCard(state)}
        </div>
      </div>
    </section>
  `;
}
