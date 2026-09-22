import "./styles/globals.css";
import "./styles/jersey.css";

import { store } from "./state/appState";
import { getCurrentBasePrice, getRemainingSpotCount } from "./services/pricing";
import { formatPrice, escapeHtml } from "./utils/formatting";
import { processLogoFile, validateLogoFile } from "./utils/imageProcessing";
import { parseHash } from "./router";
import { spotPublicUrl } from "./services/urls";
import { captureAttribution } from "./services/attribution";
import { ConsoleAnalyticsProvider } from "./services/analytics";

import { renderHeader } from "./components/header";
import { renderHero } from "./components/hero";
import { renderStats } from "./components/stats";
import { renderWhyCards } from "./components/whyCards";
import { renderActivityFeed } from "./components/activityFeed";
import { renderFomo } from "./components/fomo";
import { renderHowItWorks } from "./components/howItWorks";
import { renderExplorer } from "./components/explorer";
import { renderLeaderboard } from "./components/leaderboard";
import { renderFooter } from "./components/footer";
import { renderClaimForm } from "./components/claimModal";
import { renderSuccessPanel } from "./components/successModal";
import { renderSpotProfile } from "./components/spotProfile";
import { renderDevTools } from "./components/devTools";
import { renderSpotPage } from "./components/spotPage";
import { renderLegalPage } from "./components/legalPage";

const root = document.querySelector<HTMLDivElement>("#app")!;
const attribution = captureAttribution();
const analytics = new ConsoleAnalyticsProvider(attribution);

// ---------------- Routing ----------------

store.setRoute(parseHash());
window.addEventListener("hashchange", () => store.setRoute(parseHash()));

function updateMetaTags(): void {
  const state = store.getState();
  const route = state.route;
  let title = "dibs.lol — call dibs on the jersey";
  let description = "200 spots, one jersey. Call dibs before the price climbs.";

  if (route.name === "spot") {
    const spot = state.spots.find((s) => s.id === route.id);
    if (spot?.status === "claimed") {
      title = `Spot #${spot.id} — dibs.lol`;
      description = `${spot.buyerName ?? "Someone"} called dibs on Spot #${spot.id}.`;
    }
  } else if (route.name === "legal") {
    title = `${route.slug} — dibs.lol`;
  }

  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", window.location.href);
}

// ---------------- Focus management for modals ----------------

let lastFocusedBeforeModal: HTMLElement | null = null;

function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  if (e.key !== "Tab") return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// ---------------- Render ----------------

function renderOverlay(): string {
  const state = store.getState();

  if (state.claimStep === "form") {
    return `<div class="overlay" data-role="overlay">${renderClaimForm(state)}</div>`;
  }
  if (state.claimStep === "success") {
    return `<div class="overlay" data-role="overlay">${renderSuccessPanel(state)}</div>`;
  }
  if (state.viewingSpotId !== null) {
    return `<div class="overlay overlay--center" data-role="overlay">${renderSpotProfile(state)}</div>`;
  }
  return "";
}

function renderStickyCta(): string {
  const state = store.getState();
  if (state.route.name !== "home") return "";
  const remaining = getRemainingSpotCount(state.spots);
  if (remaining === 0) {
    return `<div class="sticky-cta"><span class="sticky-cta__price">Every spot's called. Sold out.</span></div>`;
  }
  const price = getCurrentBasePrice(state.campaign.pricing, state.spots);
  return `
    <div class="sticky-cta">
      <span class="sticky-cta__price">Going for: <span>${formatPrice(price, state.campaign.pricing.currency)}</span></span>
      <button class="btn btn-accent" data-action="start-claim">Call dibs</button>
    </div>
  `;
}

function renderHome(state: ReturnType<typeof store.getState>): string {
  return `
    ${renderHero(state)}
    ${renderStats(state)}
    ${renderWhyCards()}
    ${renderActivityFeed(state, Date.now())}
    ${renderFomo(state)}
    ${renderHowItWorks()}
    ${renderExplorer(state)}
    ${renderLeaderboard(state)}
  `;
}

function render(): void {
  const state = store.getState();
  const price = getCurrentBasePrice(state.campaign.pricing, state.spots);

  // Every text field in the claim form is synced to store state on every
  // keystroke (see the "input" listener below), not just on submit - so a
  // re-render triggered mid-form (e.g. the async logo upload finishing)
  // never wipes what's already been typed. That means this render() can
  // run while a form field is focused, so it has to restore focus (and
  // cursor position) to whatever data-role element had it, generalized
  // beyond just the search box.
  const active = document.activeElement as HTMLInputElement | null;
  const activeRole = active?.getAttribute("data-role") ?? null;
  const selectableTypes = new Set(["text", "search", "email", "tel", "url", "password"]);
  const canRestoreSelection = active instanceof HTMLInputElement && selectableTypes.has(active.type);
  const selStart = canRestoreSelection ? active!.selectionStart : null;
  const selEnd = canRestoreSelection ? active!.selectionEnd : null;

  const page =
    state.route.name === "spot"
      ? renderSpotPage(state, state.route.id)
      : state.route.name === "legal"
        ? renderLegalPage(state.route.slug)
        : renderHome(state);

  root.innerHTML = `
    ${renderHeader()}
    ${page}
    ${state.route.name === "home" ? renderFooter() : ""}
    ${renderStickyCta()}
    ${renderDevTools(state, price)}
    ${renderOverlay()}
  `;

  updateMetaTags();
  document.body.classList.toggle("has-sticky-cta", state.route.name === "home");

  if (activeRole) {
    const next = root.querySelector<HTMLInputElement>(`[data-role="${activeRole}"]`);
    if (next) {
      next.focus();
      if (selStart !== null && selEnd !== null) next.setSelectionRange(selStart, selEnd);
    }
  }

  const claimNameInput = root.querySelector<HTMLInputElement>('[data-role="name-input"]');
  if (claimNameInput && state.claimStep === "form") {
    if (!state.pendingClaim?.buyerName) claimNameInput.focus();
  }

  const overlay = root.querySelector<HTMLElement>('[data-role="overlay"]');
  if (overlay && !lastFocusedBeforeModal) {
    lastFocusedBeforeModal = document.activeElement as HTMLElement;
  } else if (!overlay && lastFocusedBeforeModal) {
    lastFocusedBeforeModal.focus?.();
    lastFocusedBeforeModal = null;
  }
}

store.subscribe(render);
render();
analytics.track("page_view");

// ---------------- Tooltip ----------------

let tooltipEl: HTMLDivElement | null = null;

function ensureTooltip(): HTMLDivElement {
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "spot-tooltip";
    tooltipEl.style.display = "none";
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

const TIER_LABEL: Record<string, string> = { standard: "Standard", premium: "Premium", hero: "Hero" };

function showTooltip(target: SVGGElement, clientX: number, clientY: number): void {
  const spotId = Number(target.getAttribute("data-spot-id"));
  const state = store.getState();
  const spot = state.spots.find((s) => s.id === spotId);
  if (!spot) return;

  const tip = ensureTooltip();
  if (spot.status === "available") {
    const price = getCurrentBasePrice(state.campaign.pricing, state.spots);
    const multiplier = spot.tier === "standard" ? 1 : spot.tier === "premium" ? 3 : 5;
    tip.innerHTML = `
      <div class="spot-tooltip__title">Spot #${spot.id} &middot; ${TIER_LABEL[spot.tier]}</div>
      <div class="spot-tooltip__price">${formatPrice(price * multiplier, state.campaign.pricing.currency)}</div>
      <div class="spot-tooltip__sub">Click to call dibs</div>
    `;
  } else if (spot.status === "reserved") {
    tip.innerHTML = `
      <div class="spot-tooltip__title">Spot #${spot.id}</div>
      <div class="spot-tooltip__sub">Someone's calling dibs on this right now</div>
    `;
  } else {
    tip.innerHTML = `
      <div class="spot-tooltip__title">Spot #${spot.id} &middot; ${TIER_LABEL[spot.tier]}</div>
      <div class="spot-tooltip__sub">${escapeHtml(spot.buyerName ?? "")}</div>
    `;
  }
  tip.style.left = `${clientX}px`;
  tip.style.top = `${clientY - 14}px`;
  tip.style.display = "block";
}

function hideTooltip(): void {
  if (tooltipEl) tooltipEl.style.display = "none";
}

document.addEventListener("mouseover", (e) => {
  const target = (e.target as Element).closest?.(".jersey-spot") as SVGGElement | null;
  if (target) showTooltip(target, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
});

document.addEventListener("mousemove", (e) => {
  if (tooltipEl && tooltipEl.style.display === "block") {
    const target = (e.target as Element).closest?.(".jersey-spot");
    if (target) {
      tooltipEl.style.left = `${(e as MouseEvent).clientX}px`;
      tooltipEl.style.top = `${(e as MouseEvent).clientY - 14}px`;
    }
  }
});

document.addEventListener(
  "mouseout",
  (e) => {
    const target = (e.target as Element).closest?.(".jersey-spot");
    if (target) hideTooltip();
  },
  true,
);

document.addEventListener("touchstart", hideTooltip, { passive: true });
document.addEventListener("scroll", hideTooltip, true);

// ---------------- Click delegation ----------------

function scrollToExplorer(): void {
  document.getElementById("explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function activateSpot(spotId: number): void {
  const state = store.getState();
  const spot = state.spots.find((s) => s.id === spotId);
  if (spot?.status === "available") {
    store.selectSingleSpot(spotId);
    analytics.track("spot_selected", { spotId });
  } else if (spot?.status === "claimed") {
    store.viewSpot(spotId);
    store.trackProfileView(spotId);
    analytics.track("public_spot_view", { spotId });
  }
  hideTooltip();
}

document.addEventListener("click", (e) => {
  const el = e.target as HTMLElement;

  const spotEl = el.closest<SVGGElement>(".jersey-spot");
  if (spotEl) {
    activateSpot(Number(spotEl.getAttribute("data-spot-id")));
    return;
  }

  const actionEl = el.closest<HTMLElement>("[data-action]");
  if (!actionEl) return;
  const action = actionEl.getAttribute("data-action");
  const spotIdAttr = actionEl.getAttribute("data-spot-id");
  const spotId = spotIdAttr ? Number(spotIdAttr) : null;

  switch (action) {
    case "start-claim":
      scrollToExplorer();
      break;
    case "explore-jersey":
      scrollToExplorer();
      break;
    case "close-claim":
      store.cancelClaim();
      break;
    case "close-spot-profile":
      store.closeSpotProfile();
      break;
    case "remove-logo":
      store.updatePendingClaim({ logoUrl: undefined });
      break;
    case "view-my-spot":
      store.closeClaimFlow();
      scrollToExplorer();
      break;
    case "share-spot":
      void handleShare();
      break;
    case "share-spot-page":
      if (spotId !== null) void handleSpotPageShare(spotId);
      break;
    case "visit-spot-website":
      if (spotId !== null) {
        store.trackOutboundClick(spotId);
        analytics.track("outbound_click", { spotId });
      }
      break;
    // Everything below this point is dev/demo-only tooling. Guarding each
    // case behind import.meta.env?.DEV (a compile-time constant) means
    // these branches - not just the buttons that would trigger them - are
    // dead-code-eliminated from the production bundle, so they're inert
    // even against a hand-crafted click event in production.
    case "toggle-admin":
      if (import.meta.env?.DEV) store.toggleDevTools();
      break;
    case "close-admin":
      if (import.meta.env?.DEV) store.closeDevTools();
      break;
    case "simulate-one":
      if (import.meta.env?.DEV) store.seedDemoBuyers(1);
      break;
    case "seed-data":
      if (import.meta.env?.DEV) store.seedDemoBuyers(30);
      break;
    case "fill-50":
      if (import.meta.env?.DEV) store.fillToPercent(0.5);
      break;
    case "fill-90":
      if (import.meta.env?.DEV) store.fillToPercent(0.9);
      break;
    case "sold-out":
      if (import.meta.env?.DEV) store.soldOut();
      break;
    case "moderate-approve":
      if (import.meta.env?.DEV && spotId !== null) store.setModerationStatus(spotId, "approved");
      break;
    case "moderate-reject":
      if (import.meta.env?.DEV && spotId !== null) store.setModerationStatus(spotId, "rejected");
      break;
    case "reset-all":
      if (import.meta.env?.DEV && window.confirm("Reset local prototype data? This clears all claims and demo data in this browser.")) {
        store.resetAllData();
      }
      break;
    case "toggle-mobile-nav":
      document.querySelector(".site-nav")?.classList.toggle("site-nav--open");
      break;
    case "noop":
      e.preventDefault();
      break;
  }
});

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.getAttribute("data-role") === "overlay") {
    const state = store.getState();
    if (state.claimStep) store.cancelClaim();
    if (state.viewingSpotId !== null) store.closeSpotProfile();
  }
});

// ---------------- Keyboard activation for jersey spots ----------------

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const target = e.target as Element;
  const spotEl = target.closest?.(".jersey-spot") as SVGGElement | null;
  if (!spotEl) return;
  e.preventDefault();
  activateSpot(Number(spotEl.getAttribute("data-spot-id")));
});

// ---------------- Search ----------------

document.addEventListener("input", (e) => {
  const el = e.target as HTMLElement;
  if (el.getAttribute("data-role") === "search-input") {
    store.setSearchQuery((el as HTMLInputElement).value);
    analytics.track("search_used");
  }
});

// ---------------- Claim form field sync ----------------
// Keeps store.pendingClaim in step with every keystroke (not just on
// submit) so a re-render triggered mid-form - most notably the async logo
// upload below calling updatePendingClaim({ logoUrl }) - merges onto the
// text the visitor has already typed instead of the still-blank initial
// state, which used to wipe the whole form the moment a photo finished
// uploading. Left untrimmed here on purpose (trimming while typing would
// eat a trailing space between words); the submit handler still trims
// before it validates and stores anything.

const CLAIM_FIELD_BY_ROLE: Record<string, "buyerName" | "company" | "email" | "website" | "tagline"> = {
  "name-input": "buyerName",
  "company-input": "company",
  "email-input": "email",
  "website-input": "website",
  "tagline-input": "tagline",
};

document.addEventListener("input", (e) => {
  const el = e.target as HTMLInputElement;
  const role = el.getAttribute("data-role");
  if (!role) return;
  if (role === "terms-input") {
    store.updatePendingClaim({ agreedToTerms: el.checked });
    return;
  }
  const field = CLAIM_FIELD_BY_ROLE[role];
  if (!field) return;
  store.updatePendingClaim({ [field]: el.value });
});

// ---------------- Claim form submit ----------------

document.addEventListener("submit", (e) => {
  const form = e.target as HTMLElement;
  if (form.getAttribute("data-role") !== "claim-form") return;
  e.preventDefault();

  const nameInput = form.querySelector<HTMLInputElement>('[data-role="name-input"]');
  const companyInput = form.querySelector<HTMLInputElement>('[data-role="company-input"]');
  const emailInput = form.querySelector<HTMLInputElement>('[data-role="email-input"]');
  const websiteInput = form.querySelector<HTMLInputElement>('[data-role="website-input"]');
  const taglineInput = form.querySelector<HTMLInputElement>('[data-role="tagline-input"]');
  const termsInput = form.querySelector<HTMLInputElement>('[data-role="terms-input"]');

  store.updatePendingClaim({
    buyerName: nameInput?.value.trim() ?? "",
    company: companyInput?.value.trim() ?? "",
    email: emailInput?.value.trim() ?? "",
    website: websiteInput?.value.trim() ?? "",
    tagline: taglineInput?.value.trim() ?? "",
    agreedToTerms: termsInput?.checked ?? false,
  });
  void handleBooking();
});

// ---------------- Logo upload ----------------

function setLogoError(message: string): void {
  // Re-queried fresh on every call rather than cached once at the top of
  // handleLogoFile: a keystroke in another field can re-render the whole
  // form (and replace this node) while this upload is still awaiting
  // validation/processing, which would otherwise leave us writing into a
  // detached element the visitor can no longer see.
  const errorEl = document.querySelector<HTMLElement>('[data-role="logo-error"]');
  if (errorEl) errorEl.textContent = message;
}

async function handleLogoFile(file: File): Promise<void> {
  analytics.track("logo_upload_started");
  const error = await validateLogoFile(file);
  if (error) {
    setLogoError(error);
    return;
  }
  setLogoError("");

  const result = await processLogoFile(file);
  if (result.error) {
    setLogoError(result.error);
    return;
  }
  store.updatePendingClaim({ logoUrl: result.dataUrl });
  setLogoError("");
  analytics.track("logo_upload_completed");
}

document.addEventListener("change", (e) => {
  const input = e.target as HTMLInputElement;
  if (input.getAttribute("data-role") === "logo-input" && input.files?.[0]) {
    void handleLogoFile(input.files[0]);
  }
});

document.addEventListener("click", (e) => {
  const dropzone = (e.target as HTMLElement).closest<HTMLElement>('[data-role="dropzone"]');
  if (dropzone) {
    dropzone.querySelector<HTMLInputElement>('[data-role="logo-input"]')?.click();
  }
});

document.addEventListener("dragover", (e) => {
  const dropzone = (e.target as HTMLElement).closest<HTMLElement>('[data-role="dropzone"]');
  if (dropzone) {
    e.preventDefault();
    dropzone.classList.add("dropzone--active");
  }
});

document.addEventListener("dragleave", (e) => {
  const dropzone = (e.target as HTMLElement).closest<HTMLElement>('[data-role="dropzone"]');
  if (dropzone) dropzone.classList.remove("dropzone--active");
});

document.addEventListener("drop", (e) => {
  const dropzone = (e.target as HTMLElement).closest<HTMLElement>('[data-role="dropzone"]');
  if (!dropzone) return;
  e.preventDefault();
  dropzone.classList.remove("dropzone--active");
  const file = (e as DragEvent).dataTransfer?.files?.[0];
  if (file) void handleLogoFile(file);
});

// ---------------- Booking ----------------

async function handleBooking(): Promise<void> {
  analytics.track("booking_started");
  const result = await store.bookSpot();
  if (result.success) {
    analytics.track("booking_succeeded");
  } else if (result.error) {
    analytics.track("booking_failed", { error: result.error });
  }
}

// ---------------- Share ----------------

async function copyOrShare(message: string, url: string): Promise<void> {
  const shareText = `${message} ${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ text: message, url, title: "dibs.lol" });
      return;
    } catch {
      // user cancelled the native share sheet; fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(shareText);
    const toast = document.querySelector<HTMLElement>('[data-role="copy-toast"]');
    if (toast) {
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 1800);
    }
  } catch {
    // clipboard API unavailable; nothing more we can do client-side
  }
}

async function handleShare(): Promise<void> {
  const state = store.getState();
  const spotId = state.pendingClaim?.spotIds[0];
  if (spotId === undefined) return;
  const spot = state.spots.find((s) => s.id === spotId);
  if (!spot) return;

  const message = `I just called dibs on Spot #${spot.id} on dibs.lol.`;
  await copyOrShare(message, spotPublicUrl(spot.id));
  analytics.track("spot_shared", { spotId: spot.id });
}

async function handleSpotPageShare(spotId: number): Promise<void> {
  const state = store.getState();
  const spot = state.spots.find((s) => s.id === spotId);
  if (!spot) return;
  const message = `${spot.buyerName ?? "Someone"} called dibs on Spot #${spot.id}.`;
  await copyOrShare(message, spotPublicUrl(spot.id));
  analytics.track("spot_shared", { spotId });
}

// ---------------- Keyboard shortcuts ----------------

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const state = store.getState();
    if (state.claimStep) store.cancelClaim();
    else if (state.viewingSpotId !== null) store.closeSpotProfile();
    else if (state.devToolsOpen) store.closeDevTools();
  }

  const overlay = root.querySelector<HTMLElement>('[data-role="overlay"]');
  if (overlay) trapFocus(overlay, e);
});
