import type { AppState } from "../types";
import { FOUNDING_SPOT_THRESHOLD } from "../services/pricing";
import { formatPrice } from "../utils/formatting";

export function renderSuccessPanel(state: AppState): string {
  const order = state.lastOrderId;
  const spotIds = state.pendingClaim?.spotIds ?? [];
  const spots = spotIds.map((id) => state.spots.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
  if (!order || spots.length === 0) return "";

  const total = spots.reduce((sum, s) => sum + (s.pricePaid ?? 0), 0);
  const multi = spots.length > 1;
  const anyFounding = spots.some((s) => (s.purchaseRank ?? Infinity) <= FOUNDING_SPOT_THRESHOLD);
  const spotList = spots.map((s) => `#${s.id}`).join(", ");

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>

      <div class="success-mark">&#10003;</div>
      <h2 class="success-title">You're on the jersey.</h2>
      <p class="success-detail">
        You claimed <strong>Spot${multi ? "s" : ""} ${spotList}</strong> for <strong>${formatPrice(total, state.campaign.pricing.currency)}</strong>.
        Your spot${multi ? "s are" : " is"} now visible on the public jersey.
      </p>

      ${anyFounding ? `<div class="spot-profile__founding">Founding member</div>` : ""}

      <div class="share-card">
        <p class="share-card__eyebrow">The Internet Jersey</p>
        <p class="share-card__title">I just got on&nbsp;The Internet Jersey.</p>
        <div class="share-card__row">
          <span>Spot${multi ? "s" : ""} ${spotList}</span>
          <span>Paid ${formatPrice(total, state.campaign.pricing.currency)}</span>
        </div>
      </div>

      <div class="success-actions">
        <button class="btn btn-ghost btn-block" data-action="view-my-spot">View my spot${multi ? "s" : ""}</button>
        <button class="btn btn-primary btn-block" data-action="share-spot">Share it</button>
      </div>
      <p class="success-note">You got in before the price increased.</p>
      <p class="copy-toast" data-role="copy-toast" style="display:none">Copied &#10003;</p>
    </div>
  `;
}
