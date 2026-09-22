import type { AppState } from "../types";
import { FOUNDING_SPOT_THRESHOLD } from "../services/pricing";
import { formatPrice, initialsOf, escapeHtml, safeWebsiteHref } from "../utils/formatting";
import { TOTAL_SPOTS } from "../data/spots";

const TIER_LABELS: Record<string, string> = { standard: "Standard", premium: "Premium", hero: "Hero" };

export function renderSpotPage(state: AppState, spotId: number): string {
  const spot = state.spots.find((s) => s.id === spotId);

  if (!spot || spot.id > TOTAL_SPOTS || spot.id < 1) {
    return `
      <div class="spot-page">
        <div class="container spot-page__inner spot-page__inner--empty">
          <a href="#/" class="legal-back">&larr; Back to the jersey</a>
          <h1 class="legal-title">Spot not found</h1>
          <p>There's no spot #${spotId} on this edition.</p>
        </div>
      </div>
    `;
  }

  if (spot.status !== "claimed") {
    return `
      <div class="spot-page">
        <div class="container spot-page__inner spot-page__inner--empty">
          <a href="#/" class="legal-back">&larr; Back to the jersey</a>
          <p class="section-eyebrow">Spot #${spot.id} &middot; ${TIER_LABELS[spot.tier]}</p>
          <h1 class="legal-title">This spot hasn't been claimed yet.</h1>
          <p>Be the first name here.</p>
          <a href="#/" class="btn btn-accent" style="margin-top:16px;display:inline-flex;">Explore the jersey</a>
        </div>
      </div>
    `;
  }

  const isFounding = (spot.purchaseRank ?? Infinity) <= FOUNDING_SPOT_THRESHOLD;
  const logo = spot.logoUrl
    ? `<img src="${spot.logoUrl}" alt="${escapeHtml(spot.buyerName ?? "")} logo" />`
    : initialsOf(spot.buyerName ?? "?");
  const href = spot.website ? safeWebsiteHref(spot.website) : null;
  const purchasedDate = spot.purchasedAt ? new Date(spot.purchasedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "-";

  return `
    <div class="spot-page">
      <div class="container spot-page__inner">
        <a href="#/" class="legal-back">&larr; Back to the jersey</a>

        <div class="spot-page__card">
          <p class="section-eyebrow">Spot #${spot.id} &middot; Edition 001</p>
          <div class="spot-page__tier-row">
            <span class="tier-badge tier-badge--${spot.tier}">${TIER_LABELS[spot.tier]}</span>
            ${isFounding ? `<span class="spot-profile__founding">Founding member</span>` : ""}
          </div>

          <div class="spot-profile__logo spot-page__logo">${logo}</div>
          <h1 class="spot-page__name">${escapeHtml(spot.buyerName ?? "")}</h1>
          ${spot.tagline ? `<p class="spot-page__tagline">${escapeHtml(spot.tagline)}</p>` : ""}

          <div class="spot-page__stats">
            <div>
              <p class="price-card__block-label">Purchased for</p>
              <p class="spot-page__stat-value">${formatPrice(spot.pricePaid ?? 0, state.campaign.pricing.currency)}</p>
            </div>
            <div>
              <p class="price-card__block-label">Purchase rank</p>
              <p class="spot-page__stat-value">#${spot.purchaseRank ?? "-"}</p>
            </div>
            <div>
              <p class="price-card__block-label">Claimed</p>
              <p class="spot-page__stat-value spot-page__stat-value--sm">${purchasedDate}</p>
            </div>
          </div>

          ${
            href
              ? `<a class="btn btn-primary btn-block" data-action="visit-spot-website" data-spot-id="${spot.id}" href="${href}" target="_blank" rel="noopener noreferrer">Visit website</a>`
              : ""
          }

          <div class="spot-page__metrics">
            <div>
              <p class="spot-page__stat-value">${spot.profileViews ?? 0}</p>
              <p class="price-card__block-label">Profile views</p>
            </div>
            <div>
              <p class="spot-page__stat-value">${spot.outboundClicks ?? 0}</p>
              <p class="price-card__block-label">Website clicks</p>
            </div>
          </div>
          <p class="spot-page__disclaimer">Real numbers for this spot, updated live.</p>

          <button class="btn btn-ghost btn-block" data-action="share-spot-page" data-spot-id="${spot.id}" style="margin-top:14px;">Share this spot</button>
          ${spot.isDemo ? `<p class="spot-page__demo-note">Seeded demo data (local dev only).</p>` : ""}
        </div>
      </div>
    </div>
  `;
}
