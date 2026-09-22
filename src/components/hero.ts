import type { AppState } from "../types";
import { renderPriceCard } from "./priceCard";
import { renderCharacterSvg } from "./character";
import { getCurrentDay, getRemainingSpotCount } from "../services/pricing";

export function renderHero(state: AppState, now: number): string {
  const remaining = getRemainingSpotCount(state.spots);
  const soldOut = remaining === 0;
  const day = getCurrentDay(state.config, now, state.demoDay);

  const eyebrow = soldOut
    ? "The jersey is full"
    : day === 1
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
      <div class="container hero__grid">
        <div class="hero__text">
          <p class="hero__eyebrow"><span class="live-dot"></span> ${eyebrow}</p>
          <h1 class="hero__title">${
            soldOut ? "Every spot has<br/>been claimed." : "Own a tiny piece<br/>of the internet."
          }</h1>
          <p class="hero__subtitle">
            ${
              soldOut
                ? "Every spot on this jersey is taken. Explore who's on it."
                : "Claim a spot on the jersey before tomorrow makes it more expensive."
            }
          </p>
          ${actions}
          ${renderPriceCard(state, now)}
        </div>
        <div class="hero__visual">
          ${renderCharacterSvg(state.spots, {
            selectionMode: false,
            selectedSpotId: state.selectedSpotId,
            justClaimedSpotId: state.lastPurchasedSpotId,
          })}
        </div>
      </div>
    </section>
  `;
}
