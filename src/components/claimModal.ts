import type { AppState } from "../types";
import { renderJerseySvg } from "./jersey";
import { getClaimedSpots, getCurrentPrice } from "../services/pricing";
import { formatPrice, escapeHtml } from "../utils/formatting";

function previewSpots(state: AppState, spotId: number) {
  return state.spots.map((s) =>
    s.id === spotId
      ? {
          ...s,
          status: "claimed" as const,
          buyerName: state.pendingClaim?.buyerName || "You",
          logoUrl: state.pendingClaim?.logoUrl,
        }
      : s,
  );
}

export function renderClaimForm(state: AppState): string {
  const spotId = state.selectedSpotId!;
  const price = getCurrentPrice(state.config, state.spots);
  const claim = state.pendingClaim!;
  const preview = previewSpots(state, spotId);

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

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>
      <h2 class="panel__title">Claim Spot #${spotId}</h2>

      <div class="panel__preview">
        ${renderJerseySvg(preview, { idPrefix: "preview", selectedSpotId: spotId })}
      </div>

      <div class="claim-price-box">
        <div>
          <div class="claim-price-box__label">Current price</div>
          <div class="claim-price-box__value">${formatPrice(price, state.config.currency)}</div>
        </div>
        <div class="claim-price-box__label">Locked in at purchase</div>
      </div>

      <ul class="claim-checklist">
        <li>Your name/logo</li>
        <li>Public profile</li>
        <li>Permanent jersey placement*</li>
      </ul>

      <form data-role="claim-form">
        <div class="field">
          <label for="claim-name">Name</label>
          <input id="claim-name" name="name" type="text" placeholder="Your name or brand" value="${escapeHtml(claim.buyerName)}" required maxlength="40" data-role="name-input" />
        </div>
        <div class="field">
          <label for="claim-website">Website <span style="text-transform:none;font-weight:500;">(optional)</span></label>
          <input id="claim-website" name="website" type="text" placeholder="https://..." value="${escapeHtml(claim.website)}" data-role="website-input" />
        </div>
        <div class="field">
          <label>Upload logo <span style="text-transform:none;font-weight:500;">(optional)</span></label>
          ${logoBlock}
          <p class="field-error" data-role="logo-error"></p>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Continue</button>
        <p class="form-terms">By continuing, you agree to the demo terms. Logos are subject to moderation in the production version.</p>
      </form>
    </div>
  `;
}

export function renderClaimCheckout(state: AppState): string {
  const spotId = state.selectedSpotId!;
  const price = getCurrentPrice(state.config, state.spots);
  const claim = state.pendingClaim!;
  const rank = getClaimedSpots(state.spots).length + 1;

  return `
    <div class="panel" data-role="claim-panel">
      <button class="panel__close" data-action="close-claim" aria-label="Close">&times;</button>
      <span class="checkout-badge">Test checkout</span>
      <h2 class="panel__title">Simulate payment</h2>

      <div class="claim-price-box">
        <div>
          <div class="claim-price-box__label">Spot #${spotId}</div>
          <div class="claim-price-box__value">${formatPrice(price, state.config.currency)}</div>
        </div>
        <div class="claim-price-box__label">Claim #${rank}</div>
      </div>

      <div class="checkout-row">
        <span class="checkout-row__label">Buyer</span>
        <span class="checkout-row__value">${escapeHtml(claim.buyerName)}</span>
      </div>
      ${
        claim.website
          ? `<div class="checkout-row"><span class="checkout-row__label">Website</span><span class="checkout-row__value">${escapeHtml(claim.website)}</span></div>`
          : ""
      }
      <div class="checkout-row">
        <span class="checkout-row__label">Price</span>
        <span class="checkout-row__value">${formatPrice(price, state.config.currency)}</span>
      </div>

      <div style="margin-top:24px;display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-accent btn-block" data-action="simulate-payment">Simulate payment</button>
        <button class="btn btn-ghost btn-block" data-action="back-to-form">Back</button>
      </div>
      <p class="form-terms">This is a prototype. No real payment is processed. Production checkout will use a real payment provider, with pricing always calculated server-side.</p>
    </div>
  `;
}
