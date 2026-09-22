import type { LegalSlug } from "../types";

export interface LegalPage {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

export const LEGAL_PAGES: Record<LegalSlug, LegalPage> = {
  rules: {
    title: "Rules",
    updated: "2026-09-22",
    sections: [
      {
        heading: "How pricing works",
        body: [
          "200 spots on the jersey: 160 Standard, 28 Premium, 12 Hero. Premium spots cost 3x the base price, Hero spots cost 5x.",
          "The base price starts at $0.10 and rises 6% with every spot claimed, edition-wide. Once you book a spot, your price is locked in for good.",
        ],
      },
      {
        heading: "What you can submit",
        body: [
          "A name or brand, an optional logo, an optional website, and an optional one-line tagline.",
          "No hate speech, sexual content, malware or phishing links, impersonation, or anything illegal.",
        ],
      },
      {
        heading: "Moderation",
        body: ["Every submission is reviewed before it's shown publicly, and can be removed later if it breaks these rules."],
      },
      {
        heading: "After you book",
        body: [
          "Your spot goes public right away: your name or logo, a shareable page, and real view/click counts.",
          "A spot stays live for as long as this edition does.",
        ],
      },
    ],
  },
};
