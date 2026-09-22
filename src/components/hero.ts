import type { AppState } from "../types";
import { renderPriceCard } from "./priceCard";
import { renderJerseySvg } from "./jersey";
import { FOUNDING_SPOT_THRESHOLD, getClaimedSpots } from "../services/pricing";

export function renderHero(state: AppState): string {
  const soldOut = state.campaign.status === "sold_out";
  const claimed = getClaimedSpots(state.spots).length;

  const eyebrow = soldOut
    ? "Every spot is spoken for"
    : claimed < FOUNDING_SPOT_THRESHOLD
      ? "Founding dibs are still up for grabs"
      : "One jersey. 200 spots. Calling dibs gets pricier every time.";

  const actions = soldOut
    ? `<div class="hero__actions">
        <button class="btn btn-ghost" data-action="explore-jersey">See who called it</button>
      </div>`
    : `<div class="hero__actions">
        <button class="btn btn-accent" data-action="start-claim">Call dibs</button>
        <button class="btn btn-ghost" data-action="explore-jersey">See the jersey</button>
      </div>`;

  return `
    <section class="hero" id="top">
      <div class="container">
        <div class="hero__stage">
          <div class="hero__glow" aria-hidden="true"></div>
          ${renderJerseySvg(state.spots, {
            idPrefix: "hero",
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
          <h1 class="hero__title">${soldOut ? "Every spot has been called." : "Call dibs on the jersey."}</h1>
          <p class="hero__subtitle">
            ${
              soldOut
                ? "All 200 spots are taken. Come see who got there first."
                : "200 spots, one jersey. The longer you wait, the more the next spot costs."
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
