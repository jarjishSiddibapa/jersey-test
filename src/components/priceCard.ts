import type { AppState } from "../types";
import { getCurrentBasePrice, getNextBasePrice, getClaimedSpots } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderPriceCard(state: AppState): string {
  const current = getCurrentBasePrice(state.campaign.pricing, state.spots);
  const next = getNextBasePrice(state.campaign.pricing, state.spots);
  const claimed = getClaimedSpots(state.spots).length;
  const total = state.campaign.totalSpots;
  const pct = Math.round((claimed / total) * 100);
  const growthPct = Math.round(state.campaign.pricing.growthRate * 1000) / 10;

  return `
    <div class="price-card">
      <div class="price-card__row">
        <div>
          <p class="price-card__block-label">Going rate now</p>
          <div class="price-card__today-value">${formatPrice(current, state.campaign.pricing.currency)}</div>
        </div>
        <div>
          <p class="price-card__block-label">Next person pays</p>
          <div class="price-card__tomorrow-value">${formatPrice(next, state.campaign.pricing.currency)}</div>
        </div>
      </div>
      <p class="price-card__growth-label">+${growthPct}% every time someone calls dibs &middot; Standard/Premium/Hero multiply this rate</p>
      <div class="price-card__divider"></div>
      <div class="price-card__progress-track">
        <div class="price-card__progress-fill" style="width:${pct}%"></div>
      </div>
      <p class="price-card__progress-label">${claimed} / ${total} spots called &middot; ${total - claimed} still up for grabs</p>
    </div>
  `;
}
