import type { Reservation } from "../types";

/**
 * Race-condition protection (PHASE 8 / section 26 of the product spec):
 * a spot a buyer has picked should be held for them briefly so two
 * people can't both complete checkout on the same spot, and released
 * automatically if they abandon checkout.
 *
 * IMPORTANT LIMITATION: this implementation only coordinates within one
 * browser tab. A real guarantee that two DIFFERENT visitors can never
 * both claim the same spot requires a database transaction / row lock /
 * unique constraint on the backend (see README schema: reservations
 * table, unique (edition_id, spot_id) on spots.status = 'claimed'). This
 * class exists so the app already calls reserve/release/expire at the
 * right points in the flow - swapping the body for real API calls later
 * doesn't change any caller.
 */
const RESERVATION_TTL_MS = 10 * 60 * 1000;

export function createReservation(spotId: number, buyerSessionId: string, now: number = Date.now()): Reservation {
  return {
    spotId,
    buyerSessionId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + RESERVATION_TTL_MS).toISOString(),
  };
}

export function isExpired(reservation: Reservation, now: number = Date.now()): boolean {
  return new Date(reservation.expiresAt).getTime() <= now;
}

export function getOrCreateSessionId(): string {
  const key = "internet-jersey:session-id";
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const fresh = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return `sess_${Date.now()}`;
  }
}
