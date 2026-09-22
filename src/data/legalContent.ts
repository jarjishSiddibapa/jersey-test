import type { LegalSlug } from "../types";

export interface LegalPage {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

/**
 * Real starting content, not placeholder links (section 31 of the
 * product spec) - but still content a real lawyer should review before
 * a commercial, money-moving launch (see the notice rendered above every
 * page in components/legalPage.ts). Written to avoid the word
 * "permanent" and to avoid any language implying investment/appreciation
 * (sections 31/63): a purchase buys visibility on Edition 001 for as
 * long as that edition stays live, not a financial instrument.
 */
export const LEGAL_PAGES: Record<LegalSlug, LegalPage> = {
  terms: {
    title: "Terms",
    updated: "2026-09-22",
    sections: [
      {
        heading: "What you're buying",
        body: [
          "Claiming a spot on The Internet Jersey buys display placement: your name, brand, logo and/or website link shown at that spot for as long as the edition you claimed it on stays live, subject to these terms and our content moderation policy.",
          "It is not an investment, a financial security, or a promise of future value, traffic, or resale price. The price rises with every claim as a campaign mechanic, not as a signal of appreciation - see the Content Policy for what you're allowed to submit.",
        ],
      },
      {
        heading: "Pricing",
        body: [
          "The price of a spot is set by its position in the global claim sequence for its edition and its tier (Standard, Premium or Hero), calculated at the moment your payment is confirmed. Once paid, your price is locked in and won't change.",
        ],
      },
      {
        heading: "Moderation",
        body: [
          "Every logo, name and website is subject to review before it's shown publicly, and can be disabled afterward if it violates the Content Policy. We'll try to notify you if that happens.",
        ],
      },
      {
        heading: "Edition closure",
        body: [
          "An edition may close, sell out, or be archived. Archived editions remain viewable but no longer accept new claims. We'll give reasonable notice before any change that affects already-claimed spots.",
        ],
      },
      {
        heading: "Service interruptions",
        body: [
          "We aim for the site and your spot to stay up, but don't guarantee uninterrupted availability. Outages, migrations or maintenance windows don't entitle you to a refund on their own - see Refunds for what does.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy",
    updated: "2026-09-22",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you claim a spot: your name/brand, email, website (optional), tagline (optional) and the logo you upload.",
          "Automatically: basic usage analytics (page views, which spot you interacted with, referral/UTM source) and, for your own claimed spot, factual counters like profile views and outbound link clicks.",
        ],
      },
      {
        heading: "What we show publicly",
        body: [
          "Only what you choose to publish on your spot's public page: display name/brand, logo, website link and tagline if provided. Your email is never shown publicly.",
        ],
      },
      {
        heading: "What we don't do",
        body: [
          "We don't sell your data. We don't fabricate activity, view counts, or purchase notifications - anything shown to you or about you is real.",
        ],
      },
    ],
  },
  refunds: {
    title: "Refunds",
    updated: "2026-09-22",
    sections: [
      {
        heading: "When a refund applies",
        body: [
          "If your logo or website is rejected in moderation and you don't want to resubmit, or if a technical error on our side resulted in a duplicate or failed-but-charged claim, you're entitled to a full refund.",
        ],
      },
      {
        heading: "When it doesn't",
        body: [
          "Change of mind after a spot is claimed and live doesn't qualify for a refund - the price you paid reflects your position in the claim sequence at that moment, and later claimants pay more specifically because your spot is no longer available.",
        ],
      },
      {
        heading: "How to request one",
        body: ["Use the Contact page with your order ID and we'll respond within a reasonable timeframe."],
      },
    ],
  },
  contact: {
    title: "Contact",
    updated: "2026-09-22",
    sections: [
      {
        heading: "Get in touch",
        body: [
          "This is an early-stage project run by a single founder. For order issues, moderation appeals, or anything else, reach out via the email on your purchase confirmation, or open an issue on the project's GitHub repository.",
        ],
      },
    ],
  },
  "content-policy": {
    title: "Content Policy",
    updated: "2026-09-22",
    sections: [
      {
        heading: "Prohibited content",
        body: [
          "No hate speech, harassment, or content targeting protected groups.",
          "No sexually explicit content, gore, or content promoting self-harm.",
          "No malware, phishing links, or websites designed to deceive.",
          "No impersonation of another person, brand or organization you don't represent.",
          "No illegal goods or services, and nothing violating a third party's intellectual property.",
        ],
      },
      {
        heading: "Review",
        body: [
          "Every submission starts as pending and is reviewed before it appears publicly. Approved content can still be disabled later if it's later found to violate this policy or if the linked website's content changes.",
        ],
      },
    ],
  },
};
