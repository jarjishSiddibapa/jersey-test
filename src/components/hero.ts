import type { AppState } from "../types";
import { renderPriceCard } from "./priceCard";
import { renderCharacterSvg } from "./character";
import { FOUNDING_SPOT_THRESHOLD, getClaimedSpots } from "../services/pricing";

export function renderHero(state: AppState): string {
  const soldOut = state.campaign.status === "sold_out";
  const claimed = getClaimedSpots(state.spots).length;

  const eyebrow = soldOut
    ? "Edition 001 is sold out"
    : claimed < FOUNDING_SPOT_THRESHOLD
      ? "Founding spots are live"
      : "One jersey. Limited spots. Rising prices.";

  const actions = soldOut
    ? `<div class="hero__actions">
        <button class="btn btn-ghost" data-action="explore-jersey">Explore the jersey</button>
      </div>`
    : `<div class="hero__actions">
        <button class="btn btn-accent" data-action="start-claim">Claim a spot</button>
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
            selectedSpotIds: state.selectedSpotIds,
            justClaimedSpotIds: state.claimStep === "success" ? (state.pendingClaim?.spotIds ?? []) : [],
            // decorative only - the interactive jersey (search, hover
            // pricing, click-to-claim) lives in the explorer section
            // below. Without this, a keyboard user would have to tab
            // through 200 hero spots before reaching the CTA.
            interactive: false,
          })}
        </div>

        <div class="hero__copy">
          <p class="hero__eyebrow"><span class="live-dot"></span> ${eyebrow}</p>
          <h1 class="hero__title">${soldOut ? "Every spot has been claimed." : "Own a spot on the internet."}</h1>
          <p class="hero__subtitle">
            ${
              soldOut
                ? "Every spot on this jersey is taken. Explore who's on it."
                : "200 spots. One jersey. Every claim makes the next one more expensive."
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
