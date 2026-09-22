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
          "200 spots on the jersey: 160 Standard, 28 Premium, 12 Hero. Premium costs 3x the going rate, Hero costs 5x.",
          "The going rate starts at $0.10 and climbs 6% every time someone calls dibs, edition-wide. Whatever you pay is locked in for good the moment you call it.",
        ],
      },
      {
        heading: "What you can put on your spot",
        body: [
          "A name or brand, an optional logo, an optional website, and an optional one-line tagline.",
          "No hate speech, sexual content, malware or phishing links, impersonation, or anything illegal.",
        ],
      },
      {
        heading: "Moderation",
        body: ["Every submission gets a quick review before it goes public, and can be pulled later if it breaks these rules."],
      },
      {
        heading: "After you call dibs",
        body: [
          "Your spot goes live right away: your name or logo, a shareable page, and real view/click counts.",
          "It's yours for as long as this edition stays up.",
        ],
      },
    ],
  },
};
