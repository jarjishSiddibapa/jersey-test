import type { AppState } from "../types";
import { renderJerseySvg } from "./jersey";
import { getClaimedSpots } from "../services/pricing";
import { escapeHtml } from "../utils/formatting";
import { MAX_SELECTION } from "../state/appState";

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
  const selectedCount = state.selectedSpotIds.length;

  const banner = state.selectionMode
    ? `<div class="selection-banner">
        <span>${
          selectedCount === 0
            ? `Choose your spots &mdash; click any open square on the jersey (up to ${MAX_SELECTION}).`
            : `${selectedCount} spot${selectedCount === 1 ? "" : "s"} selected.`
        }</span>
        <span class="selection-banner__actions">
          ${selectedCount > 0 ? `<button data-action="confirm-multi-select">Continue</button>` : ""}
          <button data-action="cancel-selection">Cancel</button>
        </span>
      </div>`
    : "";

  return `
    <section class="section" id="explorer">
      <div class="container">
        <p class="section-eyebrow">The jersey</p>
        <h2 class="section-title">Who's on it?</h2>
        <p class="section-subtitle">Every name below claimed their place. Click any spot to see who owns it, or claim an open one.</p>

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

        ${state.selectionMode ? "" : `<button class="btn btn-ghost" data-action="enter-multi-select" style="margin-bottom:18px;">Select multiple spots</button>`}
        ${banner}

        <div class="jersey-stage${state.selectionMode ? " jersey-spots-pulse" : ""}" data-role="jersey-stage">
          ${renderJerseySvg(state.spots, {
            idPrefix: "explorer",
            highlightedIds: matches,
            selectionMode: state.selectionMode,
            selectedSpotIds: state.selectedSpotIds,
            justClaimedSpotIds: state.claimStep === "success" ? (state.pendingClaim?.spotIds ?? []) : [],
          })}
        </div>
      </div>
    </section>
  `;
}
