import type { AppState } from "../types";
import { getClaimedSpots } from "../services/pricing";
import { TOTAL_SPOTS } from "../data/spots";

export function renderStats(state: AppState, now: number): string {
  const claimed = getClaimedSpots(state.spots).length;
  const remaining = TOTAL_SPOTS - claimed;
  const day = state.demoDay ?? Math.max(1, Math.floor((now - new Date(state.config.projectStartDate).getTime()) / state.config.pricingInterval) + 1);

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
          <div class="stat-item__value">Day ${day}</div>
          <div class="stat-item__label">Current era</div>
        </div>
      </div>
    </div>
  `;
}
