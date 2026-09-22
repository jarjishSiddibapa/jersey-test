import type { AppState } from "../types";
import { getClaimedSpots, getCurrentBasePrice } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderStats(state: AppState): string {
  const claimed = getClaimedSpots(state.spots).length;
  const total = state.campaign.totalSpots;
  const remaining = total - claimed;
  const price = getCurrentBasePrice(state.campaign.pricing, state.spots);

  return `
    <div class="stats-strip">
      <div class="container stats-strip__inner">
        <div class="stat-item">
          <div class="stat-item__value">${total}</div>
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
          <div class="stat-item__value stat-item__value--accent">${formatPrice(price, state.campaign.pricing.currency)}</div>
          <div class="stat-item__label">Current base price</div>
        </div>
      </div>
    </div>
  `;
}
