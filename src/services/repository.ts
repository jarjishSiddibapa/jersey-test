import type { ActivityEntry, Buyer, Campaign, Order, Spot } from "../types";
import { LocalStorageService } from "./storage";

/**
 * Storage-agnostic contract for reading/writing edition state. The
 * prototype implements this against localStorage; production would swap
 * in a MySQL-backed repository behind the same interface (see README
 * "Database schema" for the table shapes these methods map onto:
 * campaigns, spots, orders, buyers, activity).
 */
export interface SpotRepository {
  loadCampaign(): Campaign | null;
  saveCampaign(campaign: Campaign): void;
  loadSpots(): Spot[] | null;
  saveSpots(spots: Spot[]): void;
  loadActivity(): ActivityEntry[] | null;
  saveActivity(activity: ActivityEntry[]): void;
  loadOrders(): Order[] | null;
  saveOrders(orders: Order[]): void;
  loadBuyers(): Buyer[] | null;
  saveBuyers(buyers: Buyer[]): void;
  clearAll(): void;
}

export class LocalSpotRepository implements SpotRepository {
  private readonly storage = new LocalStorageService("internet-jersey");

  loadCampaign(): Campaign | null {
    return this.storage.get<Campaign>("campaign");
  }

  saveCampaign(campaign: Campaign): void {
    this.storage.set("campaign", campaign);
  }

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

  loadOrders(): Order[] | null {
    return this.storage.get<Order[]>("orders");
  }

  saveOrders(orders: Order[]): void {
    this.storage.set("orders", orders);
  }

  loadBuyers(): Buyer[] | null {
    return this.storage.get<Buyer[]>("buyers");
  }

  saveBuyers(buyers: Buyer[]): void {
    this.storage.set("buyers", buyers);
  }

  clearAll(): void {
    this.storage.clearAll(["campaign", "spots", "activity", "orders", "buyers"]);
  }
}
