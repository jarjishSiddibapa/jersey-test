import type { AppState } from "../types";
import { getCurrentBasePrice, getNextBasePrice } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderFomo(state: AppState): string {
  const current = getCurrentBasePrice(state.campaign.pricing, state.spots);
  const next = getNextBasePrice(state.campaign.pricing, state.spots);

  return `
    <section class="section--tight">
      <div class="container">
        <div class="fomo-panel">
          <div>
            <p class="fomo-panel__title">The price keeps climbing.</p>
            <p class="fomo-panel__note">Everyone after you pays more.</p>
          </div>
          <div class="fomo-panel__prices">
            <div>
              <p class="fomo-panel__price-label">Current base price</p>
              <div class="fomo-panel__price-value">${formatPrice(current, state.campaign.pricing.currency)}</div>
            </div>
            <div>
              <p class="fomo-panel__price-label">Next base price</p>
              <div class="fomo-panel__price-value">${formatPrice(next, state.campaign.pricing.currency)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
