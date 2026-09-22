import type { AppState } from "../types";
import { getCurrentPrice, getNextPrice, getClaimedSpots } from "../services/pricing";
import { TOTAL_SPOTS } from "../data/spots";
import { formatPrice } from "../utils/formatting";

export function renderPriceCard(state: AppState, now: number): string {
  const today = getCurrentPrice(state.config, now, state.demoDay);
  const tomorrow = getNextPrice(state.config, now, state.demoDay);
  const claimed = getClaimedSpots(state.spots).length;
  const pct = Math.round((claimed / TOTAL_SPOTS) * 100);

  return `
    <div class="price-card">
      <div class="price-card__row">
        <div>
          <p class="price-card__block-label">Today</p>
          <div class="price-card__today-value">${formatPrice(today, state.config.currency)}</div>
        </div>
        <div>
          <p class="price-card__block-label">Tomorrow</p>
          <div class="price-card__tomorrow-value">${formatPrice(tomorrow, state.config.currency)}</div>
        </div>
      </div>
      <div class="price-card__divider"></div>
      <p class="price-card__countdown-label">Price increases in</p>
      <div class="price-card__countdown-value" data-role="countdown">00:00:00</div>
      <div class="price-card__progress-track">
        <div class="price-card__progress-fill" style="width:${pct}%"></div>
      </div>
      <p class="price-card__progress-label">${claimed} / ${TOTAL_SPOTS} spots claimed</p>
    </div>
  `;
}
