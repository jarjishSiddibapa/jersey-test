import "./styles/globals.css";
import "./styles/jersey.css";

import { store } from "./state/appState";
import { getCurrentPrice, getRemainingSpotCount } from "./services/pricing";
import { formatPrice } from "./utils/formatting";
import { processLogoFile, validateLogoFile } from "./utils/imageProcessing";

import { renderHeader } from "./components/header";
import { renderHero } from "./components/hero";
import { renderStats } from "./components/stats";
import { renderWhyCards } from "./components/whyCards";
import { renderActivityFeed } from "./components/activityFeed";
import { renderFomo } from "./components/fomo";
import { renderHowItWorks } from "./components/howItWorks";
import { renderExplorer } from "./components/explorer";
import { renderLeaderboard } from "./components/leaderboard";
import { renderAbout } from "./components/about";
import { renderFooter } from "./components/footer";
import { renderClaimForm, renderClaimCheckout } from "./components/claimModal";
import { renderSuccessPanel } from "./components/successModal";
import { renderSpotProfile } from "./components/spotProfile";
import { renderPrototypeAdmin } from "./components/prototypeAdmin";

const root = document.querySelector<HTMLDivElement>("#app")!;

function renderOverlay(): string {
  const state = store.getState();

  if (state.claimStep === "form") {
    return `<div class="overlay" data-role="overlay">${renderClaimForm(state)}</div>`;
  }
  if (state.claimStep === "checkout") {
    return `<div class="overlay" data-role="overlay">${renderClaimCheckout(state)}</div>`;
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
  const remaining = getRemainingSpotCount(state.spots);
  if (remaining === 0) {
    return `<div class="sticky-cta"><span class="sticky-cta__price">The jersey is full</span></div>`;
  }
  const price = getCurrentPrice(state.config, state.spots);
  return `
    <div class="sticky-cta">
      <span class="sticky-cta__price">Current: <span>${formatPrice(price, state.config.currency)}</span></span>
      <button class="btn btn-accent" data-action="start-claim">Claim your spot</button>
    </div>
  `;
}

function render(): void {
  const state = store.getState();
  const now = Date.now();
  const price = getCurrentPrice(state.config, state.spots);

  // preserve focus/selection on the live search input across re-renders
  const active = document.activeElement as HTMLInputElement | null;
  const wasSearchFocused = active?.getAttribute("data-role") === "search-input";
  const selStart = wasSearchFocused ? active!.selectionStart : null;
  const selEnd = wasSearchFocused ? active!.selectionEnd : null;

  root.innerHTML = `
    ${renderHeader()}
    ${renderHero(state)}
    ${renderStats(state)}
    ${renderWhyCards()}
    ${renderActivityFeed(state, now)}
    ${renderFomo(state)}
    ${renderHowItWorks()}
    ${renderExplorer(state)}
    ${renderLeaderboard(state)}
    ${renderAbout()}
    ${renderFooter()}
    ${renderStickyCta()}
    ${renderPrototypeAdmin(state, price)}
    ${renderOverlay()}
  `;

  if (wasSearchFocused) {
    const next = root.querySelector<HTMLInputElement>('[data-role="search-input"]');
    if (next) {
      next.focus();
      if (selStart !== null && selEnd !== null) next.setSelectionRange(selStart, selEnd);
    }
  }

  const claimNameInput = root.querySelector<HTMLInputElement>('[data-role="name-input"]');
  if (claimNameInput && state.claimStep === "form") {
    // Only autofocus a freshly opened, empty form so success/back
    // transitions don't yank focus away from the user.
    if (!state.pendingClaim?.buyerName) claimNameInput.focus();
  }
}

store.subscribe(render);
render();

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

function showTooltip(target: SVGGElement, clientX: number, clientY: number): void {
  const spotId = Number(target.getAttribute("data-spot-id"));
  const state = store.getState();
  const spot = state.spots.find((s) => s.id === spotId);
  if (!spot) return;

  const tip = ensureTooltip();
  if (spot.status === "available") {
    const price = getCurrentPrice(state.config, state.spots);
    tip.innerHTML = `
      <div class="spot-tooltip__title">Spot #${spot.id}</div>
      <div class="spot-tooltip__price">${formatPrice(price, state.config.currency)}</div>
      <div class="spot-tooltip__sub">Click to claim</div>
    `;
  } else {
    tip.innerHTML = `
      <div class="spot-tooltip__title">Spot #${spot.id}</div>
      <div class="spot-tooltip__sub">${spot.buyerName ?? ""}</div>
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

// touch devices don't fire mouseout reliably, so the tooltip can get
// stuck visible after a tap; clear it on the gestures that follow one.
document.addEventListener("touchstart", hideTooltip, { passive: true });
document.addEventListener("scroll", hideTooltip, true);

// ---------------- Click delegation ----------------

function scrollToExplorer(): void {
  document.getElementById("explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", (e) => {
  const el = e.target as HTMLElement;

  const spotEl = el.closest<SVGGElement>(".jersey-spot");
  if (spotEl) {
    const spotId = Number(spotEl.getAttribute("data-spot-id"));
    const state = store.getState();
    const spot = state.spots.find((s) => s.id === spotId);
    if (spot?.status === "available") {
      store.selectSpot(spotId);
    } else if (spot?.status === "claimed") {
      store.viewSpot(spotId);
    }
    hideTooltip();
    return;
  }

  const actionEl = el.closest<HTMLElement>("[data-action]");
  if (!actionEl) return;
  const action = actionEl.getAttribute("data-action");

  switch (action) {
    case "start-claim":
      store.enterSelectionMode();
      scrollToExplorer();
      break;
    case "explore-jersey":
      scrollToExplorer();
      break;
    case "cancel-selection":
      store.exitSelectionMode();
      break;
    case "close-claim":
      store.cancelClaim();
      break;
    case "close-spot-profile":
      store.closeSpotProfile();
      break;
    case "back-to-form":
      store.backToForm();
      break;
    case "simulate-payment":
      void store.confirmPayment();
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
    case "toggle-admin":
      store.toggleAdmin();
      break;
    case "close-admin":
      store.toggleAdmin();
      break;
    case "simulate-one":
      store.seedDemoBuyers(1);
      break;
    case "seed-data":
      store.seedDemoBuyers(30);
      break;
    case "fill-50":
      store.fillToPercent(0.5);
      break;
    case "fill-90":
      store.fillToPercent(0.9);
      break;
    case "sold-out":
      store.soldOut();
      break;
    case "reset-all":
      if (window.confirm("Reset prototype data? This clears all claims and demo data.")) {
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

// clicking the dimmed overlay background (not its panel content) closes it
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.getAttribute("data-role") === "overlay") {
    const state = store.getState();
    if (state.claimStep) store.cancelClaim();
    if (state.viewingSpotId !== null) store.closeSpotProfile();
  }
});

// ---------------- Search ----------------

document.addEventListener("input", (e) => {
  const el = e.target as HTMLElement;
  if (el.getAttribute("data-role") === "search-input") {
    store.setSearchQuery((el as HTMLInputElement).value);
  }
});

// ---------------- Claim form submit ----------------

document.addEventListener("submit", (e) => {
  const form = e.target as HTMLElement;
  if (form.getAttribute("data-role") !== "claim-form") return;
  e.preventDefault();

  const nameInput = form.querySelector<HTMLInputElement>('[data-role="name-input"]');
  const websiteInput = form.querySelector<HTMLInputElement>('[data-role="website-input"]');
  const name = nameInput?.value.trim() ?? "";

  if (!name) {
    nameInput?.focus();
    return;
  }

  store.updatePendingClaim({ buyerName: name, website: websiteInput?.value.trim() ?? "" });
  store.goToCheckout();
});

// ---------------- Logo upload ----------------

async function handleLogoFile(file: File): Promise<void> {
  const error = validateLogoFile(file);
  const errorEl = document.querySelector<HTMLElement>('[data-role="logo-error"]');
  if (error) {
    if (errorEl) errorEl.textContent = error;
    return;
  }
  if (errorEl) errorEl.textContent = "";

  const result = await processLogoFile(file);
  if (result.error) {
    if (errorEl) errorEl.textContent = result.error;
    return;
  }
  store.updatePendingClaim({ logoUrl: result.dataUrl });
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

// ---------------- Share ----------------

async function handleShare(): Promise<void> {
  const state = store.getState();
  const spot = state.spots.find((s) => s.id === state.lastPurchasedSpotId);
  if (!spot) return;

  const message = `I just claimed a spot on The Internet Jersey for ${formatPrice(
    spot.pricePaid ?? 0,
    state.config.currency,
  )}. What spot would you take?`;

  if (navigator.share) {
    try {
      await navigator.share({ text: message, title: "The Internet Jersey" });
      return;
    } catch {
      // user cancelled the native share sheet; fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(message);
    const toast = document.querySelector<HTMLElement>('[data-role="copy-toast"]');
    if (toast) {
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 1800);
    }
  } catch {
    // clipboard API unavailable; nothing more we can do in-prototype
  }
}

// ---------------- Keyboard shortcuts ----------------

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const state = store.getState();
    if (state.claimStep) store.cancelClaim();
    else if (state.viewingSpotId !== null) store.closeSpotProfile();
    else if (state.prototypeAdminOpen) store.closeAdmin();
    else if (state.selectionMode) store.exitSelectionMode();
  }
  if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
    e.preventDefault();
    store.toggleAdmin();
  }
});
