import type { ActivityEntry, AppState, PendingClaim, PricingConfig, Spot } from "../types";
import { DEFAULT_PRICING_CONFIG, getCurrentDay, getCurrentPrice } from "../services/pricing";
import { LocalSpotRepository, type SpotRepository } from "../services/repository";
import { DemoPaymentService } from "../services/demoPayment";
import { generateSpots, TOTAL_SPOTS } from "../data/spots";
import { seedDemoBuyers } from "../data/seedData";

type Listener = () => void;

function freshConfig(): PricingConfig {
  // Anchors Day 1 to the moment the prototype is first opened (or reset),
  // and caps price growth so demo-clocking many days ahead stays sane.
  return { ...DEFAULT_PRICING_CONFIG, projectStartDate: new Date().toISOString(), maximumPrice: 2500 };
}

export class AppStore {
  private state: AppState;
  private readonly listeners = new Set<Listener>();
  private readonly repository: SpotRepository;
  private readonly payments = new DemoPaymentService();

  constructor(repository: SpotRepository = new LocalSpotRepository()) {
    this.repository = repository;
    this.state = this.loadInitialState();
  }

  private loadInitialState(): AppState {
    const config = this.repository.loadConfig() ?? freshConfig();
    const storedSpots = this.repository.loadSpots();
    const spots = storedSpots && storedSpots.length === TOTAL_SPOTS ? storedSpots : generateSpots();
    const activity = this.repository.loadActivity() ?? [];
    const demoDay = this.repository.loadDemoDay();

    return {
      config,
      demoDay,
      spots,
      activity,
      selectionMode: false,
      selectedSpotId: null,
      viewingSpotId: null,
      claimStep: null,
      pendingClaim: null,
      lastPurchasedSpotId: null,
      searchQuery: "",
      prototypeAdminOpen: false,
    };
  }

  getState(): AppState {
    return this.state;
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
    this.repository.saveSpots(this.state.spots);
    this.repository.saveActivity(this.state.activity);
    this.repository.saveDemoDay(this.state.demoDay);
    this.repository.saveConfig(this.state.config);
  }

  // ---- derived pricing helpers (single source of truth: services/pricing) ----

  currentDay(now: number = Date.now()): number {
    return getCurrentDay(this.state.config, now, this.state.demoDay);
  }

  currentPrice(now: number = Date.now()): number {
    return getCurrentPrice(this.state.config, now, this.state.demoDay);
  }

  // ---- claim flow ----

  enterSelectionMode(): void {
    this.setState({ selectionMode: true });
  }

  exitSelectionMode(): void {
    this.setState({ selectionMode: false });
  }

  selectSpot(spotId: number): void {
    const spot = this.state.spots.find((s) => s.id === spotId);
    if (!spot || spot.status !== "available") return;
    const pendingClaim: PendingClaim = { spotId, buyerName: "", website: "" };
    this.setState({
      selectedSpotId: spotId,
      claimStep: "form",
      pendingClaim,
      selectionMode: false,
    });
  }

  updatePendingClaim(patch: Partial<PendingClaim>): void {
    if (!this.state.pendingClaim) return;
    this.setState({ pendingClaim: { ...this.state.pendingClaim, ...patch } });
  }

  goToCheckout(): void {
    if (!this.state.pendingClaim || !this.state.pendingClaim.buyerName.trim()) return;
    this.setState({ claimStep: "checkout" });
  }

  backToForm(): void {
    this.setState({ claimStep: "form" });
  }

  async confirmPayment(): Promise<void> {
    const { pendingClaim } = this.state;
    if (!pendingClaim) return;
    const result = await this.payments.simulatePayment();
    if (!result.success) return;

    const now = Date.now();
    const day = this.currentDay(now);
    const price = this.currentPrice(now);

    const spots = this.state.spots.map((s) =>
      s.id === pendingClaim.spotId
        ? ({
            ...s,
            status: "claimed" as const,
            buyerName: pendingClaim.buyerName.trim(),
            website: pendingClaim.website.trim() || undefined,
            logoUrl: pendingClaim.logoUrl,
            pricePaid: price,
            purchaseDay: day,
            purchasedAt: new Date(now).toISOString(),
          } satisfies Spot)
        : s,
    );

    const activityEntry: ActivityEntry = {
      id: `live-${pendingClaim.spotId}-${now}`,
      spotId: pendingClaim.spotId,
      buyerName: pendingClaim.buyerName.trim(),
      pricePaid: price,
      timestamp: new Date(now).toISOString(),
    };

    this.setState({
      spots,
      activity: [activityEntry, ...this.state.activity],
      claimStep: "success",
      lastPurchasedSpotId: pendingClaim.spotId,
    });
    this.persist();
  }

  closeClaimFlow(): void {
    this.setState({ selectedSpotId: null, claimStep: null, pendingClaim: null });
  }

  cancelClaim(): void {
    this.setState({ selectedSpotId: null, claimStep: null, pendingClaim: null, selectionMode: false });
  }

  // ---- viewing a claimed spot's profile ----

  viewSpot(spotId: number): void {
    const spot = this.state.spots.find((s) => s.id === spotId);
    if (!spot || spot.status !== "claimed") return;
    this.setState({ viewingSpotId: spotId });
  }

  closeSpotProfile(): void {
    this.setState({ viewingSpotId: null });
  }

  // ---- search ----

  setSearchQuery(query: string): void {
    this.setState({ searchQuery: query });
  }

  // ---- prototype / demo controls ----

  toggleAdmin(): void {
    this.setState({ prototypeAdminOpen: !this.state.prototypeAdminOpen });
  }

  closeAdmin(): void {
    this.setState({ prototypeAdminOpen: false });
  }

  advanceDay(delta: number): void {
    const current = this.currentDay();
    const next = Math.max(1, current + delta);
    this.setState({ demoDay: next });
    this.persist();
  }

  resetDemoDayToNatural(): void {
    this.setState({ demoDay: null });
    this.persist();
  }

  resetAllData(): void {
    this.repository.clearAll();
    this.state = {
      config: freshConfig(),
      demoDay: null,
      spots: generateSpots(),
      activity: [],
      selectionMode: false,
      selectedSpotId: null,
      viewingSpotId: null,
      claimStep: null,
      pendingClaim: null,
      lastPurchasedSpotId: null,
      searchQuery: "",
      prototypeAdminOpen: this.state.prototypeAdminOpen,
    };
    this.listeners.forEach((l) => l());
    this.persist();
  }

  seedDemoBuyers(count: number): void {
    const day = Math.max(this.currentDay(), 3);
    if (this.state.demoDay === null && day !== this.currentDay()) {
      this.setState({ demoDay: day });
    }
    const { spots, activity } = seedDemoBuyers(
      this.state.spots,
      count,
      this.state.config,
      this.currentDay(),
      Date.now() % 100000,
    );
    this.setState({ spots, activity: [...activity, ...this.state.activity] });
    this.persist();
  }

  fillToCount(targetClaimed: number): void {
    const currentlyClaimed = this.state.spots.filter((s) => s.status === "claimed").length;
    const need = targetClaimed - currentlyClaimed;
    if (need <= 0) return;
    this.seedDemoBuyers(need);
  }

  fillToPercent(percent: number): void {
    this.fillToCount(Math.round(TOTAL_SPOTS * percent));
  }

  soldOut(): void {
    this.fillToCount(TOTAL_SPOTS);
  }
}

export const store = new AppStore();
