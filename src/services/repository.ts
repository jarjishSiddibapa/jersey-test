import type { ActivityEntry, PricingConfig, Spot } from "../types";
import { LocalStorageService } from "./storage";

/**
 * Storage-agnostic contract for reading/writing jersey state. The
 * prototype implements this against localStorage; production would swap
 * in a SupabaseSpotRepository (or similar) behind the same interface.
 */
export interface SpotRepository {
  loadSpots(): Spot[] | null;
  saveSpots(spots: Spot[]): void;
  loadActivity(): ActivityEntry[] | null;
  saveActivity(activity: ActivityEntry[]): void;
  loadDemoDay(): number | null;
  saveDemoDay(day: number | null): void;
  loadConfig(): PricingConfig | null;
  saveConfig(config: PricingConfig): void;
  clearAll(): void;
}

export class LocalSpotRepository implements SpotRepository {
  private readonly storage = new LocalStorageService("internet-jersey");

  loadSpots(): Spot[] | null {
    return this.storage.get<Spot[]>("spots");
  }

  saveSpots(spots: Spot[]): void {
    this.storage.set("spots", spots);
  }

  loadActivity(): ActivityEntry[] | null {
    return this.storage.get<ActivityEntry[]>("activity");
  }

  saveActivity(activity: ActivityEntry[]): void {
    this.storage.set("activity", activity);
  }

  loadDemoDay(): number | null {
    return this.storage.get<number | null>("demoDay");
  }

  saveDemoDay(day: number | null): void {
    this.storage.set("demoDay", day);
  }

  loadConfig(): PricingConfig | null {
    return this.storage.get<PricingConfig>("config");
  }

  saveConfig(config: PricingConfig): void {
    this.storage.set("config", config);
  }

  clearAll(): void {
    this.storage.clearAll(["spots", "activity", "demoDay", "config"]);
  }
}
