import type { AppState } from "../types";
import { renderJerseySvg } from "./jersey";
import { priceSelection } from "../services/pricing";
import { formatPrice, escapeHtml } from "../utils/formatting";

const TIER_LABEL: Record<string, string> = { standard: "Standard", premium: "Premium", hero: "Hero" };

function previewSpots(state: AppState, spotIds: number[]) {
  const idSet = new Set(spotIds);
  return state.spots.map((s) =>
    idSet.has(s.id)
      ? {
          ...s,
          status: "claimed" as const,
          buyerName: state.pendingClaim?.buyerName || "You",
          logoUrl: state.pendingClaim?.logoUrl,
        }
      : s,
  );
}

function errorFor(state: AppState, field: string): string {
  const msg = state.formErrors[field];
  return msg ? `<p class="field-error">${escapeHtml(msg)}</p>` : "";
}

export function renderClaimForm(state: AppState): string {
  const claim = state.pendingClaim!;
  const spotIds = claim.spotIds;
  const lines = priceSelection(state.campaign.pricing, state.spots, spotIds);
  const total = lines.reduce((sum, l) => sum + l.finalPrice, 0);
  const preview = previewSpots(state, spotIds);
  const multi = spotIds.length > 1;

  const logoBlock = claim.logoUrl
    ? `<div class="dropzone-preview">
        <img src="${claim.logoUrl}" alt="Uploaded logo preview" />
        <span>Logo added</span>
        <button type="button" class="dropzone-preview__remove" data-action="remove-logo">Remove</button>
      </div>`
    : `<div class="dropzone" data-role="dropzone">
        <strong>Drop your logo here</strong>
        PNG, JPG or WebP &middot; max 1MB
        <input type="file" accept="image/png,image/jpeg,image/webp" data-role="logo-input" class="visually-hidden" />
      </div>`;

  const breakdown = multi
    ? `<div class="checkout-breakdown">
        ${lines
          .map(
            (l) => `
          <div class="checkout-row">
            <span class="checkout-row__label">Spot #${l.spotId} &middot; ${TIER_LABEL[l.tier]}</span>
            <span class="checkout-row__value">${formatPrice(l.finalPrice, state.campaign.pricing.currency)}</span>
          </div>`,
          )
          .join("")}
      </div>`
    : "";

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>
      <h2 class="panel__title">${multi ? `Claim ${spotIds.length} spots` : `Claim Spot #${spotIds[0]}`}</h2>

      <div class="panel__preview">
        ${renderJerseySvg(preview, { idPrefix: "preview", selectedSpotIds: spotIds, interactive: false })}
      </div>

      <div class="claim-price-box">
        <div>
          <div class="claim-price-box__label">${multi ? "Total price" : "Price"}</div>
          <div class="claim-price-box__value">${formatPrice(total, state.campaign.pricing.currency)}</div>
        </div>
        <div class="claim-price-box__label">Locked in at purchase</div>
      </div>
      ${breakdown}

      <ul class="claim-checklist">
        <li>Your name/logo, displayed publicly</li>
        <li>A public spot page you can share</li>
        <li>Displayed for Edition 001's lifetime, subject to moderation</li>
      </ul>

      <form data-role="claim-form">
        <div class="field">
          <label for="claim-name">Name / brand</label>
          <input id="claim-name" name="name" type="text" placeholder="Your name or brand" value="${escapeHtml(claim.buyerName)}" required maxlength="60" data-role="name-input" />
          ${errorFor(state, "buyerName")}
        </div>
        <div class="field">
          <label for="claim-company">Company <span style="text-transform:none;font-weight:500;">(optional)</span></label>
          <input id="claim-company" name="company" type="text" placeholder="Company name" value="${escapeHtml(claim.company)}" maxlength="60" data-role="company-input" />
          ${errorFor(state, "company")}
        </div>
        <div class="field">
          <label for="claim-email">Email</label>
          <input id="claim-email" name="email" type="email" placeholder="you@example.com" value="${escapeHtml(claim.email)}" required maxlength="120" data-role="email-input" />
          ${errorFor(state, "email")}
        </div>
        <div class="field">
          <label for="claim-website">Website <span style="text-transform:none;font-weight:500;">(optional)</span></label>
          <input id="claim-website" name="website" type="text" placeholder="https://..." value="${escapeHtml(claim.website)}" data-role="website-input" />
          ${errorFor(state, "website")}
        </div>
        <div class="field">
          <label for="claim-tagline">Tagline <span style="text-transform:none;font-weight:500;">(optional)</span></label>
          <input id="claim-tagline" name="tagline" type="text" placeholder="One short line about you" value="${escapeHtml(claim.tagline)}" maxlength="90" data-role="tagline-input" />
          ${errorFor(state, "tagline")}
        </div>
        <div class="field">
          <label>Upload logo <span style="text-transform:none;font-weight:500;">(optional)</span></label>
          ${logoBlock}
          <p class="field-error" data-role="logo-error"></p>
        </div>
        <label class="checkbox-field">
          <input type="checkbox" data-role="terms-input" ${claim.agreedToTerms ? "checked" : ""} />
          <span>I agree to the <a href="#/terms" target="_blank" rel="noopener">Terms</a> and <a href="#/content-policy" target="_blank" rel="noopener">Content Policy</a>.</span>
        </label>
        ${errorFor(state, "agreedToTerms")}
        <button type="submit" class="btn btn-primary btn-block">Continue</button>
      </form>
    </div>
  `;
}

export function renderClaimCheckout(state: AppState): string {
  const claim = state.pendingClaim!;
  const spotIds = claim.spotIds;
  const lines = priceSelection(state.campaign.pricing, state.spots, spotIds);
  const total = lines.reduce((sum, l) => sum + l.finalPrice, 0);
  const multi = spotIds.length > 1;

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>
      <span class="checkout-badge">Secure checkout</span>
      <h2 class="panel__title">Review &amp; pay</h2>

      <div class="checkout-breakdown">
        ${lines
          .map(
            (l) => `
          <div class="checkout-row">
            <span class="checkout-row__label">Spot #${l.spotId} &middot; ${TIER_LABEL[l.tier]} &middot; Claim #${l.purchaseRank}</span>
            <span class="checkout-row__value">${formatPrice(l.finalPrice, state.campaign.pricing.currency)}</span>
          </div>`,
          )
          .join("")}
      </div>

      <div class="claim-price-box">
        <div>
          <div class="claim-price-box__label">Total (${spotIds.length} spot${multi ? "s" : ""})</div>
          <div class="claim-price-box__value">${formatPrice(total, state.campaign.pricing.currency)}</div>
        </div>
      </div>

      <div class="checkout-row">
        <span class="checkout-row__label">Buyer</span>
        <span class="checkout-row__value">${escapeHtml(claim.buyerName)}</span>
      </div>
      <div class="checkout-row">
        <span class="checkout-row__label">Email</span>
        <span class="checkout-row__value">${escapeHtml(claim.email)}</span>
      </div>
      ${
        claim.website
          ? `<div class="checkout-row"><span class="checkout-row__label">Website</span><span class="checkout-row__value">${escapeHtml(claim.website)}</span></div>`
          : ""
      }

      <div style="margin-top:24px;display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-accent btn-block" data-action="simulate-payment">Pay ${formatPrice(total, state.campaign.pricing.currency)}</button>
        <button class="btn btn-ghost btn-block" data-action="back-to-form">Back</button>
      </div>
      <p class="form-terms">We're in early access, so this purchase won't charge a real card yet &mdash; you'll get your spot and a confirmation just like a normal order. Your price is locked in either way.</p>
      <p class="field-error" data-role="checkout-error"></p>
    </div>
  `;
}
