import type { AppState } from "../types";
import { renderJerseySvg } from "./jersey";
import { priceSelection } from "../services/pricing";
import { formatPrice, escapeHtml } from "../utils/formatting";

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
  const spotId = claim.spotIds[0];
  const lines = priceSelection(state.campaign.pricing, state.spots, claim.spotIds);
  const total = lines.reduce((sum, l) => sum + l.finalPrice, 0);
  const preview = previewSpots(state, claim.spotIds);

  const logoBlock = claim.logoUrl
    ? `<div class="dropzone-preview">
        <img src="${escapeHtml(claim.logoUrl)}" alt="Uploaded logo preview" />
        <span>Logo added</span>
        <button type="button" class="dropzone-preview__remove" data-action="remove-logo">Remove</button>
      </div>`
    : `<div class="dropzone" data-role="dropzone">
        <strong>Drop your logo here</strong>
        PNG, JPG or WebP &middot; max 1MB
        <input type="file" accept="image/png,image/jpeg,image/webp" data-role="logo-input" class="visually-hidden" />
      </div>`;

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>
      <h2 class="panel__title">Dibs on Spot #${spotId}</h2>

      <div class="panel__preview">
        ${renderJerseySvg(preview, { idPrefix: "preview", selectedSpotIds: claim.spotIds, interactive: false })}
      </div>

      <div class="claim-price-box">
        <div>
          <div class="claim-price-box__label">Price</div>
          <div class="claim-price-box__value">${formatPrice(total, state.campaign.pricing.currency)}</div>
        </div>
        <div class="claim-price-box__label">Locked in the second you call it</div>
      </div>

      <ul class="claim-checklist">
        <li>Your name or logo, front and center for everyone to see</li>
        <li>Your own shareable spot page</li>
        <li>Bragging rights for as long as Edition 001 lives</li>
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
          <input id="claim-website" name="website" type="text" placeholder="https://..." value="${escapeHtml(claim.website)}" maxlength="500" data-role="website-input" />
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
          <span>I agree to the <a href="#/rules" target="_blank" rel="noopener">Rules</a>.</span>
        </label>
        ${errorFor(state, "agreedToTerms")}
        ${errorFor(state, "general")}
        <button type="submit" class="btn btn-primary btn-block">Call dibs on #${spotId} &middot; ${formatPrice(total, state.campaign.pricing.currency)}</button>
      </form>
    </div>
  `;
}
