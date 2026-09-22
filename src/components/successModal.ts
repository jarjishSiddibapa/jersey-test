import type { AppState } from "../types";
import { FOUNDING_SPOT_THRESHOLD } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderSuccessPanel(state: AppState): string {
  const order = state.lastOrderId;
  const spotId = state.pendingClaim?.spotIds[0];
  const spot = spotId !== undefined ? state.spots.find((s) => s.id === spotId) : undefined;
  if (!order || !spot) return "";

  const price = spot.pricePaid ?? 0;
  const isFounding = (spot.purchaseRank ?? Infinity) <= FOUNDING_SPOT_THRESHOLD;

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>

      <div class="success-mark">&#10003;</div>
      <h2 class="success-title">Dibs called.</h2>
      <p class="success-detail">
        Spot <strong>#${spot.id}</strong> is yours for <strong>${formatPrice(price, state.campaign.pricing.currency)}</strong>.
        It's already live on the jersey - go take a look.
      </p>

      ${isFounding ? `<div class="spot-profile__founding">Founding member</div>` : ""}

      <div class="share-card">
        <p class="share-card__eyebrow">dibs.lol</p>
        <p class="share-card__title">I just called dibs on the jersey.</p>
        <div class="share-card__row">
          <span>Spot #${spot.id}</span>
          <span>Paid ${formatPrice(price, state.campaign.pricing.currency)}</span>
        </div>
      </div>

      <div class="success-actions">
        <button class="btn btn-ghost btn-block" data-action="view-my-spot">View my spot</button>
        <button class="btn btn-primary btn-block" data-action="share-spot">Brag about it</button>
      </div>
      <p class="success-note">You beat the price hike. Everyone after you pays more.</p>
      <p class="copy-toast" data-role="copy-toast" style="display:none">Copied &#10003;</p>
    </div>
  `;
}
