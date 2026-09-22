import type { AppState } from "../types";
import { FOUNDING_SPOT_THRESHOLD } from "../services/pricing";
import { formatPrice, initialsOf, escapeHtml, safeWebsiteHref } from "../utils/formatting";
import { spotHash } from "../router";

const TIER_LABEL: Record<string, string> = { standard: "Standard", premium: "Premium", hero: "Hero" };

export function renderSpotProfile(state: AppState): string {
  const spot = state.spots.find((s) => s.id === state.viewingSpotId);
  if (!spot) return "";

  const isFounding = (spot.purchaseRank ?? Infinity) <= FOUNDING_SPOT_THRESHOLD;
  const logo = spot.logoUrl
    ? `<img src="${escapeHtml(spot.logoUrl)}" alt="${escapeHtml(spot.buyerName ?? "")} logo" />`
    : initialsOf(spot.buyerName ?? "?");
  const href = spot.website ? safeWebsiteHref(spot.website) : null;

  return `
    <div class="panel panel--card" data-role="spot-profile-panel">
      <button class="panel__close" data-action="close-spot-profile" aria-label="Close">&times;</button>
      <p class="section-eyebrow" style="margin-bottom:16px;">Spot #${spot.id} &middot; <span class="tier-badge tier-badge--${spot.tier}">${TIER_LABEL[spot.tier]}</span></p>
      ${isFounding ? `<div class="spot-profile__founding">Founding member</div>` : ""}
      <div class="spot-profile__logo">${logo}</div>
      <h3 class="spot-profile__name">${escapeHtml(spot.buyerName ?? "")}</h3>
      ${spot.tagline ? `<p class="spot-page__tagline">${escapeHtml(spot.tagline)}</p>` : ""}
      <p class="spot-profile__meta">
        Dibs #${spot.purchaseRank ?? "-"} &middot; Paid ${formatPrice(spot.pricePaid ?? 0, state.campaign.pricing.currency)}
        ${spot.isDemo ? " &middot; Demo data" : ""}
      </p>
      ${
        href
          ? `<a class="btn btn-ghost btn-block" href="${href}" target="_blank" rel="noopener noreferrer" data-action="visit-spot-website" data-spot-id="${spot.id}" style="margin-bottom:10px;">Open website</a>`
          : ""
      }
      <a class="btn btn-primary btn-block" href="${spotHash(spot.id)}" data-action="close-spot-profile">View full public page</a>
    </div>
  `;
}
