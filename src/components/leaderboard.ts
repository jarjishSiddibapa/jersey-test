import type { AppState } from "../types";
import { escapeHtml } from "../utils/formatting";

export function renderLeaderboard(state: AppState): string {
  const claimed = state.spots.filter((s) => s.status === "claimed" && s.buyerName);

  const countsByName = new Map<string, number>();
  for (const spot of claimed) {
    const name = spot.buyerName!;
    countsByName.set(name, (countsByName.get(name) ?? 0) + 1);
  }
  const topByCount = [...countsByName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const earliest = [...claimed]
    .sort((a, b) => (a.purchaseRank ?? Infinity) - (b.purchaseRank ?? Infinity))
    .slice(0, 6);

  const countRows = topByCount.length
    ? topByCount
        .map(
          ([name, count], i) => `
        <div class="leaderboard-row">
          <span class="leaderboard-rank">${String(i + 1).padStart(2, "0")}</span>
          <span class="leaderboard-name">${escapeHtml(name)}</span>
          <span class="leaderboard-count">${count} spot${count === 1 ? "" : "s"}</span>
        </div>`,
        )
        .join("")
    : `<p class="activity-empty">Nobody's called dibs yet.</p>`;

  const earliestRows = earliest.length
    ? earliest
        .map(
          (spot, i) => `
        <div class="leaderboard-row">
          <span class="leaderboard-rank">${String(i + 1).padStart(2, "0")}</span>
          <span class="leaderboard-name">${escapeHtml(spot.buyerName ?? "")}</span>
          <span class="leaderboard-count">Dibs #${spot.purchaseRank ?? "-"}</span>
        </div>`,
        )
        .join("")
    : `<p class="activity-empty">Nobody's called dibs yet.</p>`;

  return `
    <section class="section" id="leaderboard">
      <div class="container">
        <p class="section-eyebrow">Leaderboard</p>
        <h2 class="section-title">Hall of dibs</h2>
        <p class="section-subtitle">Ranked by how many spots you've called, not by how much you spent.</p>
        <div class="leaderboard-grid">
          <div class="leaderboard-panel">
            <p class="leaderboard-panel__title">Most spots called</p>
            ${countRows}
          </div>
          <div class="leaderboard-panel">
            <p class="leaderboard-panel__title">Called dibs first</p>
            ${earliestRows}
          </div>
        </div>
      </div>
    </section>
  `;
}
