import type { LegalSlug } from "../types";
import { LEGAL_PAGES } from "../data/legalContent";
import { escapeHtml } from "../utils/formatting";

export function renderLegalPage(slug: LegalSlug): string {
  const page = LEGAL_PAGES[slug];

  const sections = page.sections
    .map(
      (section) => `
      <section class="legal-section">
        <h2>${escapeHtml(section.heading)}</h2>
        ${section.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </section>`,
    )
    .join("");

  return `
    <div class="legal-page">
      <div class="container legal-page__inner">
        <a href="#/" class="legal-back">&larr; Back to the jersey</a>
        <h1 class="legal-title">${escapeHtml(page.title)}</h1>
        <p class="legal-updated">Last updated ${escapeHtml(page.updated)}</p>
        ${sections}
      </div>
    </div>
  `;
}
