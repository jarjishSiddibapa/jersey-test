import type {
  ActivityEntry,
  AppState,
  Buyer,
  Campaign,
  CampaignStatus,
  Order,
  PendingClaim,
  Route,
  Spot,
} from "../types";
import { DEFAULT_PRICING_CONFIG, getClaimedSpots } from "../services/pricing";
import { LocalSpotRepository, type SpotRepository } from "../services/repository";
import { MockPaymentProvider } from "../services/paymentProvider";
import { ConsoleEmailProvider, type EmailProvider } from "../services/emailProvider";
import { buildBuyer, buildOrder } from "../services/orderService";
import { createReservation, getOrCreateSessionId, isExpired } from "../services/reservationService";
import { generateSpots, DEFAULT_EDITION_ID, TOTAL_SPOTS, TIER_COUNTS } from "../data/spots";
import { seedDemoBuyers } from "../data/seedData";
import { isSafeUrl, normalizeWebsiteUrl } from "../utils/formatting";
import { spotPublicUrl } from "../services/urls";

type Listener = () => void;

export const MAX_SELECTION = 9;
const RESERVATION_SWEEP_MS = 30_000;

function freshCampaign(): Campaign {
  return {
    id: DEFAULT_EDITION_ID,
    slug: "edition-001",
    name: "Edition 001",
    description: "The first Internet Jersey. 200 spots.",
    totalSpots: TOTAL_SPOTS,
    tierCounts: TIER_COUNTS,
    pricing: { ...DEFAULT_PRICING_CONFIG },
    status: "live",
    launchAt: new Date().toISOString(),
    closedAt: null,
  };
}

function deriveCampaignStatus(current: CampaignStatus, claimed: number, total: number): CampaignStatus {
  if (current === "paused" || current === "draft" || current === "archived") return current;
  return claimed >= total ? "sold_out" : "live";
}

export interface ClaimResult {
  success: boolean;
  error?: string;
}

export class AppStore {
  private state: AppState;
  private readonly listeners = new Set<Listener>();
  private readonly repository: SpotRepository;
  private readonly payments = new MockPaymentProvider();
  private readonly email: EmailProvider = new ConsoleEmailProvider();
  private readonly reservations = new Map<number, ReturnType<typeof createReservation>>();
  private orders: Order[];
  private buyers: Buyer[];

  constructor(repository: SpotRepository = new LocalSpotRepository()) {
    this.repository = repository;
    this.orders = this.repository.loadOrders() ?? [];
    this.buyers = this.repository.loadBuyers() ?? [];
    this.state = this.loadInitialState();
    if (typeof window !== "undefined") {
      window.setInterval(() => this.releaseExpiredReservations(), RESERVATION_SWEEP_MS);
    }
  }

  private loadInitialState(): AppState {
    const campaign = this.repository.loadCampaign() ?? freshCampaign();
    const storedSpots = this.repository.loadSpots();
    const spots =
      storedSpots && storedSpots.length === TOTAL_SPOTS && storedSpots.every((s) => s.editionId === campaign.id)
        ? storedSpots
        : generateSpots(campaign.id);
    const activity = this.repository.loadActivity() ?? [];

    return {
      campaign,
      spots,
      activity,
      selectionMode: false,
      selectedSpotIds: [],
      viewingSpotId: null,
      claimStep: null,
      pendingClaim: null,
      formErrors: {},
      lastOrderId: null,
      searchQuery: "",
      route: { name: "home" },
      devToolsOpen: false,
    };
  }

  getState(): AppState {
    return this.state;
  }

  getOrders(): Order[] {
    return this.orders;
  }

  getBuyers(): Buyer[] {
    return this.buyers;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  private persist(): void {
    this.repository.saveCampaign(this.state.campaign);
    this.repository.saveSpots(this.state.spots);
    this.repository.saveActivity(this.state.activity);
    this.repository.saveOrders(this.orders);
    this.repository.saveBuyers(this.buyers);
  }

  // ---- routing ----

  setRoute(route: Route): void {
    this.setState({ route });
  }

  // ---- claim flow: selection ----

  enterSelectionMode(): void {
    this.setState({ selectionMode: true, selectedSpotIds: [] });
  }

  exitSelectionMode(): void {
    this.setState({ selectionMode: false, selectedSpotIds: [] });
  }

  /** Fast path: clicking an available spot outside multi-select mode claims just that one. */
  selectSingleSpot(spotId: number): void {
    const spot = this.state.spots.find((s) => s.id === spotId);
    if (!spot || spot.status !== "available") return;
    this.beginClaim([spotId]);
  }

  /** Multi-select mode: clicking toggles membership in the running selection, up to MAX_SELECTION. */
  toggleSpotSelection(spotId: number): void {
    this.releaseExpiredReservations();
    const spot = this.state.spots.find((s) => s.id === spotId);
    if (!spot || spot.status !== "available") return;
    const already = this.state.selectedSpotIds.includes(spotId);
    if (already) {
      this.setState({ selectedSpotIds: this.state.selectedSpotIds.filter((id) => id !== spotId) });
      return;
    }
    if (this.state.selectedSpotIds.length >= MAX_SELECTION) return;
    this.setState({ selectedSpotIds: [...this.state.selectedSpotIds, spotId] });
  }

  confirmMultiSelection(): void {
    if (this.state.selectedSpotIds.length === 0) return;
    this.beginClaim(this.state.selectedSpotIds);
  }

  private beginClaim(spotIds: number[]): void {
    this.releaseExpiredReservations();
    const sessionId = getOrCreateSessionId();
    const now = Date.now();
    spotIds.forEach((id) => this.reservations.set(id, createReservation(id, sessionId, now)));
    const spots = this.state.spots.map((s) =>
      spotIds.includes(s.id) ? ({ ...s, status: "reserved" as const } satisfies Spot) : s,
    );
    const pendingClaim: PendingClaim = {
      spotIds,
      buyerName: "",
      company: "",
      email: "",
      website: "",
      tagline: "",
      agreedToTerms: false,
    };
    this.setState({ spots, claimStep: "form", pendingClaim, formErrors: {}, selectionMode: false, selectedSpotIds: [] });
  }

  updatePendingClaim(patch: Partial<PendingClaim>): void {
    if (!this.state.pendingClaim) return;
    this.setState({ pendingClaim: { ...this.state.pendingClaim, ...patch }, formErrors: {} });
  }

  /** Validates the claim form and, if valid, advances to checkout. */
  goToCheckout(): void {
    const claim = this.state.pendingClaim;
    if (!claim) return;
    const errors: Record<string, string> = {};

    if (!claim.buyerName.trim()) errors.buyerName = "Enter your name or brand.";
    else if (claim.buyerName.trim().length > 60) errors.buyerName = "Keep it under 60 characters.";

    if (!claim.email.trim()) errors.email = "Enter an email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claim.email.trim())) errors.email = "That email doesn't look valid.";

    if (claim.website.trim()) {
      const normalized = normalizeWebsiteUrl(claim.website);
      if (!isSafeUrl(normalized)) errors.website = "Enter a valid http(s) website URL.";
    }

    if (claim.company.trim().length > 60) errors.company = "Keep it under 60 characters.";
    if (claim.tagline.trim().length > 90) errors.tagline = "Keep it under 90 characters.";
    if (!claim.agreedToTerms) errors.agreedToTerms = "You need to agree to the terms to continue.";

    if (Object.keys(errors).length > 0) {
      this.setState({ formErrors: errors });
      return;
    }

    this.setState({ claimStep: "checkout", formErrors: {} });
  }

  backToForm(): void {
    this.setState({ claimStep: "form" });
  }

  async confirmPayment(): Promise<ClaimResult> {
    const claim = this.state.pendingClaim;
    if (!claim || claim.spotIds.length === 0) return { success: false, error: "Nothing selected." };

    const stillHeld = claim.spotIds.every((id) => {
      const spot = this.state.spots.find((s) => s.id === id);
      return spot && (spot.status === "reserved" || spot.status === "available");
    });
    if (!stillHeld) {
      return { success: false, error: "One of your selected spots is no longer available. Please pick again." };
    }

    const buyer = buildBuyer(claim);
    const order = buildOrder(
      this.state.campaign.pricing,
      this.state.spots,
      this.state.campaign.id,
      buyer.id,
      claim.spotIds,
    );

    const result = await this.payments.simulatePayment(order.id, order.amount, order.currency);
    if (!result.success) {
      return { success: false, error: result.error ?? "Payment failed. Please try again." };
    }

    const now = Date.now();
    const paidOrder: Order = {
      ...order,
      status: "paid",
      paymentId: result.paymentId,
      paidAt: new Date(now).toISOString(),
    };
    const itemsById = new Map(order.items.map((item) => [item.spotId, item]));

    const spots = this.state.spots.map((s) => {
      const item = itemsById.get(s.id);
      if (!item) return s;
      return {
        ...s,
        status: "claimed" as const,
        buyerName: buyer.name,
        website: buyer.website,
        logoUrl: claim.logoUrl,
        tagline: claim.tagline.trim() || undefined,
        pricePaid: item.finalPrice,
        purchaseRank: item.purchaseRank,
        purchasedAt: new Date(now).toISOString(),
        orderId: paidOrder.id,
        moderationStatus: "pending" as const,
        profileViews: 0,
        outboundClicks: 0,
      } satisfies Spot;
    });

    const activityEntries: ActivityEntry[] = order.items.map((item) => ({
      id: `live-${item.spotId}-${now}`,
      spotId: item.spotId,
      buyerName: buyer.name,
      tier: item.tier,
      pricePaid: item.finalPrice,
      timestamp: new Date(now).toISOString(),
    }));

    const claimedCount = getClaimedSpots(spots).length;
    const campaign: Campaign = {
      ...this.state.campaign,
      status: deriveCampaignStatus(this.state.campaign.status, claimedCount, this.state.campaign.totalSpots),
    };

    claim.spotIds.forEach((id) => this.reservations.delete(id));
    this.orders = [paidOrder, ...this.orders];
    this.buyers = [buyer, ...this.buyers];

    this.setState({
      spots,
      campaign,
      activity: [...activityEntries, ...this.state.activity],
      claimStep: "success",
      lastOrderId: paidOrder.id,
    });
    this.persist();

    void this.email.sendPurchaseConfirmation(
      paidOrder,
      buyer.email,
      claim.spotIds.map((id) => spotPublicUrl(id)),
    );

    return { success: true };
  }

  closeClaimFlow(): void {
    this.setState({ selectedSpotIds: [], claimStep: null, pendingClaim: null, formErrors: {} });
  }

  cancelClaim(): void {
    const claim = this.state.pendingClaim;
    if (claim) {
      claim.spotIds.forEach((id) => this.reservations.delete(id));
    }
    const spots = claim
      ? this.state.spots.map((s) =>
          claim.spotIds.includes(s.id) && s.status === "reserved" ? ({ ...s, status: "available" as const } satisfies Spot) : s,
        )
      : this.state.spots;
    this.setState({ spots, selectedSpotIds: [], claimStep: null, pendingClaim: null, formErrors: {}, selectionMode: false });
  }

  private releaseExpiredReservations(now: number = Date.now()): void {
    const expiredIds: number[] = [];
    for (const [id, reservation] of this.reservations) {
      if (isExpired(reservation, now)) {
        expiredIds.push(id);
        this.reservations.delete(id);
      }
    }
    if (expiredIds.length === 0) return;
    const spots = this.state.spots.map((s) =>
      expiredIds.includes(s.id) && s.status === "reserved" ? ({ ...s, status: "available" as const } satisfies Spot) : s,
    );
    this.setState({ spots });
  }

  // ---- viewing a claimed spot ----

  viewSpot(spotId: number): void {
    const spot = this.state.spots.find((s) => s.id === spotId);
    if (!spot || spot.status !== "claimed") return;
    this.setState({ viewingSpotId: spotId });
  }

  closeSpotProfile(): void {
    this.setState({ viewingSpotId: null });
  }

  trackProfileView(spotId: number): void {
    const spots = this.state.spots.map((s) =>
      s.id === spotId ? ({ ...s, profileViews: (s.profileViews ?? 0) + 1 } satisfies Spot) : s,
    );
    this.setState({ spots });
    this.persist();
  }

  trackOutboundClick(spotId: number): void {
    const spots = this.state.spots.map((s) =>
      s.id === spotId ? ({ ...s, outboundClicks: (s.outboundClicks ?? 0) + 1 } satisfies Spot) : s,
    );
    this.setState({ spots });
    this.persist();
  }

  // ---- moderation (dev tools only) ----

  setModerationStatus(spotId: number, status: Spot["moderationStatus"]): void {
    const spots = this.state.spots.map((s) => (s.id === spotId ? ({ ...s, moderationStatus: status } satisfies Spot) : s));
    this.setState({ spots });
    this.persist();
  }

  // ---- search ----

  setSearchQuery(query: string): void {
    this.setState({ searchQuery: query });
  }

  // ---- dev tools (compiled out of production builds - see components/devTools.ts) ----

  toggleDevTools(): void {
    this.setState({ devToolsOpen: !this.state.devToolsOpen });
  }

  closeDevTools(): void {
    this.setState({ devToolsOpen: false });
  }

  resetAllData(): void {
    this.repository.clearAll();
    this.orders = [];
    this.buyers = [];
    const campaign = freshCampaign();
    this.state = {
      ...this.state,
      campaign,
      spots: generateSpots(campaign.id),
      activity: [],
      selectionMode: false,
      selectedSpotIds: [],
      viewingSpotId: null,
      claimStep: null,
      pendingClaim: null,
      formErrors: {},
      lastOrderId: null,
      searchQuery: "",
    };
    this.listeners.forEach((l) => l());
    this.persist();
  }

  seedDemoBuyers(count: number): void {
    const startRank = getClaimedSpots(this.state.spots).length + 1;
    const { spots, activity } = seedDemoBuyers(
      this.state.spots,
      count,
      this.state.campaign.pricing,
      startRank,
      Date.now() % 100000,
    );
    const claimedCount = getClaimedSpots(spots).length;
    const campaign: Campaign = {
      ...this.state.campaign,
      status: deriveCampaignStatus(this.state.campaign.status, claimedCount, this.state.campaign.totalSpots),
    };
    this.setState({ spots, campaign, activity: [...activity, ...this.state.activity] });
    this.persist();
  }

  fillToCount(targetClaimed: number): void {
    const currentlyClaimed = getClaimedSpots(this.state.spots).length;
    const need = targetClaimed - currentlyClaimed;
    if (need <= 0) return;
    this.seedDemoBuyers(need);
  }

  fillToPercent(percent: number): void {
    this.fillToCount(Math.round(this.state.campaign.totalSpots * percent));
  }

  soldOut(): void {
    this.fillToCount(this.state.campaign.totalSpots);
  }
}

export const store = new AppStore();
