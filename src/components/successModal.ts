import type { AppState } from "../types";
import { FOUNDING_SPOT_THRESHOLD } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderSuccessPanel(state: AppState): string {
  const spot = state.spots.find((s) => s.id === state.lastPurchasedSpotId);
  if (!spot) return "";

  const isFounding = (spot.purchaseRank ?? Infinity) <= FOUNDING_SPOT_THRESHOLD;

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>

      <div class="success-mark">&#10003;</div>
      <h2 class="success-title">You're on the jersey.</h2>
      <p class="success-detail">
        You claimed <strong>Spot #${spot.id}</strong> for <strong>${formatPrice(spot.pricePaid ?? 0, state.config.currency)}</strong>.
        Your spot is now visible on the public jersey.
      </p>

      ${isFounding ? `<div class="spot-profile__founding">Founding member</div>` : ""}

      <div class="share-card">
        <p class="share-card__eyebrow">The Internet Jersey</p>
        <p class="share-card__title">I just got on&nbsp;The Internet Jersey.</p>
        <div class="share-card__row">
          <span>Spot #${spot.id}</span>
          <span>Paid ${formatPrice(spot.pricePaid ?? 0, state.config.currency)}</span>
        </div>
      </div>

      <div class="success-actions">
        <button class="btn btn-ghost btn-block" data-action="view-my-spot">View my spot</button>
        <button class="btn btn-primary btn-block" data-action="share-spot">Share it</button>
      </div>
      <p class="success-note">You got in before the price increased.</p>
      <p class="copy-toast" data-role="copy-toast" style="display:none">Copied &#10003;</p>
    </div>
  `;
}
