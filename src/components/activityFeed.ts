import type { AppState } from "../types";
import { formatPrice, formatRelativeTime, escapeHtml } from "../utils/formatting";

export function renderActivityFeed(state: AppState, now: number): string {
  const entries = state.activity.slice(0, 8);
  const hasDemo = entries.some((e) => e.isDemo);

  const rows = entries.length
    ? entries
        .map(
          (entry) => `
        <div class="activity-row">
          <span class="activity-row__who">${escapeHtml(entry.buyerName)}</span>
          <span class="activity-row__mid">claimed Spot #${entry.spotId}</span>
          <span class="activity-row__price">${formatPrice(entry.pricePaid, state.campaign.pricing.currency)}</span>
          <span class="activity-row__time">${formatRelativeTime(entry.timestamp, now)}</span>
        </div>
      `,
        )
        .join("")
    : `<div class="activity-empty">No claims yet. Be the first name on the jersey.</div>`;

  return `
    <section class="section section--tight" id="activity">
      <div class="container">
        <p class="section-eyebrow">Live</p>
        <h2 class="section-title">Recent claims</h2>
        <p class="section-subtitle">${
          hasDemo
            ? "Includes seeded demonstration data for this prototype."
            : "The latest people to claim their place on the jersey."
        }</p>
        <div class="activity-panel">${rows}</div>
      </div>
    </section>
  `;
}
