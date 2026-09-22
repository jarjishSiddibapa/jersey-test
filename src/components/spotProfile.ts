import type { AppState } from "../types";
import { FOUNDING_SPOT_THRESHOLD } from "../services/pricing";
import { formatPrice, initialsOf, escapeHtml, normalizeWebsiteUrl } from "../utils/formatting";

export function renderSpotProfile(state: AppState): string {
  const spot = state.spots.find((s) => s.id === state.viewingSpotId);
  if (!spot) return "";

  const isFounding = (spot.purchaseRank ?? Infinity) <= FOUNDING_SPOT_THRESHOLD;
  const logo = spot.logoUrl
    ? `<img src="${spot.logoUrl}" alt="${escapeHtml(spot.buyerName ?? "")} logo" />`
    : initialsOf(spot.buyerName ?? "?");

  return `
    <div class="panel panel--card" data-role="spot-profile-panel">
      <button class="panel__close" data-action="close-spot-profile" aria-label="Close">&times;</button>
      <p class="section-eyebrow" style="margin-bottom:16px;">Spot #${spot.id}</p>
      ${isFounding ? `<div class="spot-profile__founding">Founding member</div>` : ""}
      <div class="spot-profile__logo">${logo}</div>
      <h3 class="spot-profile__name">${escapeHtml(spot.buyerName ?? "")}</h3>
      <p class="spot-profile__meta">
        Claim #${spot.purchaseRank ?? "-"} &middot; Paid ${formatPrice(spot.pricePaid ?? 0, state.config.currency)}
        ${spot.isDemo ? " &middot; Demo data" : ""}
      </p>
      ${
        spot.website
          ? `<a class="btn btn-ghost btn-block" href="${normalizeWebsiteUrl(spot.website)}" target="_blank" rel="noopener noreferrer">Open website</a>`
          : ""
      }
    </div>
  `;
}
