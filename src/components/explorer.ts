import type { AppState } from "../types";
import { renderJerseySvg } from "./jersey";
import { getClaimedSpots } from "../services/pricing";
import { escapeHtml } from "../utils/formatting";

export function renderExplorer(state: AppState): string {
  const query = state.searchQuery.trim().toLowerCase();
  const matches = query
    ? new Set(
        state.spots
          .filter(
            (s) =>
              s.status === "claimed" &&
              (s.buyerName?.toLowerCase().includes(query) || s.website?.toLowerCase().includes(query)),
          )
          .map((s) => s.id),
      )
    : undefined;

  const matchCount = matches ? matches.size : null;
  const claimedCount = getClaimedSpots(state.spots).length;

  return `
    <section class="section" id="explorer">
      <div class="container">
        <p class="section-eyebrow">The jersey</p>
        <h2 class="section-title">Who's on it?</h2>
        <p class="section-subtitle">Every name below claimed their place. Click any open square to book it.</p>

        <div class="explorer-search">
          <input
            type="search"
            placeholder="Search names or brands..."
            value="${escapeHtml(state.searchQuery)}"
            data-role="search-input"
            aria-label="Search names or brands"
          />
          ${
            query
              ? `<p class="explorer-meta">${matchCount} match${matchCount === 1 ? "" : "es"} for "${escapeHtml(state.searchQuery)}"</p>`
              : `<p class="explorer-meta">${claimedCount} of ${state.spots.length} spots claimed</p>`
          }
        </div>

        <div class="jersey-stage" data-role="jersey-stage">
          ${renderJerseySvg(state.spots, {
            idPrefix: "explorer",
            highlightedIds: matches,
            justClaimedSpotIds: state.claimStep === "success" ? (state.pendingClaim?.spotIds ?? []) : [],
          })}
        </div>
      </div>
    </section>
  `;
}
