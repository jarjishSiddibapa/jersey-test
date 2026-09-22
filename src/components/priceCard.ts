import type { AppState } from "../types";
import { getCurrentPrice, getNextPrice, getClaimedSpots } from "../services/pricing";
import { TOTAL_SPOTS } from "../data/spots";
import { formatPrice } from "../utils/formatting";

export function renderPriceCard(state: AppState): string {
  const current = getCurrentPrice(state.config, state.spots);
  const next = getNextPrice(state.config, state.spots);
  const claimed = getClaimedSpots(state.spots).length;
  const pct = Math.round((claimed / TOTAL_SPOTS) * 100);

  return `
    <div class="price-card">
      <div class="price-card__row">
        <div>
          <p class="price-card__block-label">Current price</p>
          <div class="price-card__today-value">${formatPrice(current, state.config.currency)}</div>
        </div>
        <div>
          <p class="price-card__block-label">Next spot</p>
          <div class="price-card__tomorrow-value">${formatPrice(next, state.config.currency)}</div>
        </div>
      </div>
      <div class="price-card__divider"></div>
      <div class="price-card__progress-track">
        <div class="price-card__progress-fill" style="width:${pct}%"></div>
      </div>
      <p class="price-card__progress-label">${claimed} / ${TOTAL_SPOTS} spots claimed &middot; price rises with every claim</p>
    </div>
  `;
}
