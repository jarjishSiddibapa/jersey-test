import type { AppState } from "../types";
import { getClaimedSpots, getCurrentPrice } from "../services/pricing";
import { TOTAL_SPOTS } from "../data/spots";
import { formatPrice } from "../utils/formatting";

export function renderStats(state: AppState): string {
  const claimed = getClaimedSpots(state.spots).length;
  const remaining = TOTAL_SPOTS - claimed;
  const price = getCurrentPrice(state.config, state.spots);

  return `
    <div class="stats-strip">
      <div class="container stats-strip__inner">
        <div class="stat-item">
          <div class="stat-item__value">${TOTAL_SPOTS}</div>
          <div class="stat-item__label">Total spots</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__value stat-item__value--accent">${claimed}</div>
          <div class="stat-item__label">Claimed</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__value">${remaining}</div>
          <div class="stat-item__label">Remaining</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__value stat-item__value--accent">${formatPrice(price, state.config.currency)}</div>
          <div class="stat-item__label">Current price</div>
        </div>
      </div>
    </div>
  `;
}
