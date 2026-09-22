import type { AppState } from "../types";
import { getCurrentPrice, getNextPrice } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderFomo(state: AppState, now: number): string {
  const today = getCurrentPrice(state.config, now, state.demoDay);
  const tomorrow = getNextPrice(state.config, now, state.demoDay);

  return `
    <section class="section--tight">
      <div class="container">
        <div class="fomo-panel">
          <div>
            <p class="fomo-panel__title">The clock keeps moving.</p>
            <p class="fomo-panel__note">Everyone after you pays the next price.</p>
          </div>
          <div class="fomo-panel__prices">
            <div>
              <p class="fomo-panel__price-label">Today's price</p>
              <div class="fomo-panel__price-value">${formatPrice(today, state.config.currency)}</div>
            </div>
            <div>
              <p class="fomo-panel__price-label">Tomorrow</p>
              <div class="fomo-panel__price-value">${formatPrice(tomorrow, state.config.currency)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
