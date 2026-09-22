import type { AppState } from "../types";
import { getCurrentPrice, getNextPrice } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderFomo(state: AppState): string {
  const current = getCurrentPrice(state.config, state.spots);
  const next = getNextPrice(state.config, state.spots);

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
              <p class="fomo-panel__price-label">Current price</p>
              <div class="fomo-panel__price-value">${formatPrice(current, state.config.currency)}</div>
            </div>
            <div>
              <p class="fomo-panel__price-label">Next spot</p>
              <div class="fomo-panel__price-value">${formatPrice(next, state.config.currency)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
