import type { AppState } from "../types";
import { getClaimedSpots } from "../services/pricing";
import { formatPrice, escapeHtml } from "../utils/formatting";

/**
 * Local dev/demo tooling ONLY. `import.meta.env?.DEV` is a compile-time
 * constant Vite replaces with `false` in a production build, so this
 * entire panel (and its trigger in footer.ts) tree-shakes out of
 * `dist/` entirely - there is no seed/fill/sold-out/reset button, no
 * fake buyer generator, and no admin surface at all in what actually
 * ships to GitHub Pages. That's deliberate (see section 32/61 of the
 * product spec: no simulation tools, no fake activity, in production).
 * A real production admin dashboard needs real authentication and a
 * real backend, neither of which exist yet - this is not a substitute
 * for one.
 */
export function renderDevTools(state: AppState, price: number): string {
  if (!import.meta.env?.DEV) return "";
  if (!state.devToolsOpen) return "";

  const claimed = getClaimedSpots(state.spots).length;
  const pendingModeration = state.spots.filter((s) => s.status === "claimed" && s.moderationStatus === "pending");

  return `
    <div class="admin-panel" data-role="admin-panel">
      <p class="admin-panel__title">
        Dev tools (local only)
        <button class="admin-panel__close" data-action="close-admin" aria-label="Close dev tools">&times;</button>
      </p>

      <div class="admin-row">
        <span class="admin-row__label">Next base price</span>
        <span class="admin-row__value">${formatPrice(price, state.campaign.pricing.currency)}</span>
      </div>
      <div class="admin-row">
        <span class="admin-row__label">Claimed</span>
        <span class="admin-row__value">${claimed} / ${state.campaign.totalSpots}</span>
      </div>
      <div class="admin-row">
        <span class="admin-row__label">Campaign status</span>
        <span class="admin-row__value">${escapeHtml(state.campaign.status)}</span>
      </div>

      <div class="admin-actions">
        <button data-action="simulate-one">Simulate 1 purchase</button>
        <button data-action="seed-data">Seed 30 demo buyers</button>
        <button data-action="fill-50">Fill to 50%</button>
        <button data-action="fill-90">Fill to 90%</button>
        <button data-action="sold-out">Simulate sold out</button>
        <button data-action="reset-all" class="danger">Reset all data</button>
      </div>

      ${
        pendingModeration.length > 0
          ? `<p class="admin-panel__title" style="margin-top:16px;">Moderation queue (${pendingModeration.length})</p>
             <div class="moderation-queue">
               ${pendingModeration
                 .slice(0, 5)
                 .map(
                   (s) => `
                 <div class="moderation-row">
                   <span>#${s.id} &middot; ${escapeHtml(s.buyerName ?? "")}</span>
                   <span class="moderation-row__actions">
                     <button data-action="moderate-approve" data-spot-id="${s.id}">Approve</button>
                     <button data-action="moderate-reject" data-spot-id="${s.id}">Reject</button>
                   </span>
                 </div>`,
                 )
                 .join("")}
             </div>`
          : ""
      }
    </div>
  `;
}
