import type { AppState } from "../types";
import { getClaimedSpots } from "../services/pricing";
import { TOTAL_SPOTS } from "../data/spots";
import { formatPrice } from "../utils/formatting";

export function renderPrototypeAdmin(state: AppState, price: number): string {
  if (!state.prototypeAdminOpen) return "";
  const claimed = getClaimedSpots(state.spots).length;

  return `
    <div class="admin-panel" data-role="admin-panel">
      <p class="admin-panel__title">
        Prototype admin
        <button class="admin-panel__close" data-action="close-admin" aria-label="Close admin panel">&times;</button>
      </p>

      <div class="admin-row">
        <span class="admin-row__label">Next spot's price</span>
        <span class="admin-row__value">${formatPrice(price, state.config.currency)}</span>
      </div>
      <div class="admin-row">
        <span class="admin-row__label">Claimed</span>
        <span class="admin-row__value">${claimed} / ${TOTAL_SPOTS}</span>
      </div>

      <div class="admin-actions">
        <button data-action="simulate-one">Simulate 1 purchase</button>
        <button data-action="seed-data">Seed 30 demo buyers</button>
        <button data-action="fill-50">Fill to 50%</button>
        <button data-action="fill-90">Fill to 90%</button>
        <button data-action="sold-out">Simulate sold out</button>
        <button data-action="reset-all" class="danger">Reset all data</button>
      </div>
    </div>
  `;
}
