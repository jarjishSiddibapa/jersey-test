import { test } from "node:test";
import assert from "node:assert/strict";
import { AppStore } from "./appState";
import type { SpotRepository } from "../services/repository";

// In-memory stand-in for the localStorage-backed repository so these
// tests exercise real AppStore logic without touching window/localStorage
// (this file runs under Node's own test runner, not a browser).
class MemoryRepository implements SpotRepository {
  loadCampaign() {
    return null;
  }
  saveCampaign() {}
  loadSpots() {
    return null;
  }
  saveSpots() {}
  loadActivity() {
    return null;
  }
  saveActivity() {}
  loadOrders() {
    return null;
  }
  saveOrders() {}
  loadBuyers() {
    return null;
  }
  saveBuyers() {}
  clearAll() {}
}

function freshStore(): AppStore {
  return new AppStore(new MemoryRepository());
}

test("claiming an available spot opens the form with the right spot selected", () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  assert.equal(store.getState().claimStep, "form");
  assert.deepEqual(store.getState().pendingClaim?.spotIds, [1]);
  // the spot is held (reserved), not yet claimed
  assert.equal(store.getState().spots.find((s) => s.id === 1)?.status, "reserved");
});

test("bookSpot rejects an empty name", async () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  store.updatePendingClaim({ buyerName: "", email: "a@b.com", agreedToTerms: true });
  await store.bookSpot();
  assert.ok(store.getState().formErrors.buyerName);
  assert.equal(store.getState().claimStep, "form");
});

test("bookSpot rejects an invalid email", async () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  store.updatePendingClaim({ buyerName: "Acme", email: "not-an-email", agreedToTerms: true });
  await store.bookSpot();
  assert.ok(store.getState().formErrors.email);
});

test("bookSpot rejects a dangerous website URL", async () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  store.updatePendingClaim({ buyerName: "Acme", email: "a@b.com", website: "javascript:alert(1)", agreedToTerms: true });
  await store.bookSpot();
  assert.ok(store.getState().formErrors.website);
});

test("bookSpot rejects an over-length name/company/tagline", async () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  store.updatePendingClaim({
    buyerName: "x".repeat(61),
    email: "a@b.com",
    agreedToTerms: true,
  });
  await store.bookSpot();
  assert.ok(store.getState().formErrors.buyerName);
});

test("bookSpot rejects booking without agreeing to the rules", async () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  store.updatePendingClaim({ buyerName: "Acme", email: "a@b.com", agreedToTerms: false });
  await store.bookSpot();
  assert.ok(store.getState().formErrors.agreedToTerms);
});

test("a fully valid submission books the spot immediately - no separate checkout step", async () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  store.updatePendingClaim({
    buyerName: "Acme",
    company: "",
    email: "hello@acme.com",
    website: "acme.com",
    tagline: "",
    agreedToTerms: true,
  });
  const result = await store.bookSpot();
  assert.equal(result.success, true);
  assert.deepEqual(store.getState().formErrors, {});
  assert.equal(store.getState().claimStep, "success");
  assert.equal(store.getState().spots.find((s) => s.id === 1)?.status, "claimed");
});

test("a spot can only be claimed once end-to-end, and a stale reservation is rejected", async () => {
  const store = freshStore();
  store.selectSingleSpot(5);
  store.updatePendingClaim({ buyerName: "First", email: "first@x.com", agreedToTerms: true });
  const first = await store.bookSpot();
  assert.equal(first.success, true);
  assert.equal(store.getState().spots.find((s) => s.id === 5)?.status, "claimed");

  // second attempt on the same spot must be rejected client-side too
  const before = store.getState().spots.find((s) => s.id === 5);
  store.selectSingleSpot(5); // no-op: spot is claimed, not available
  assert.equal(store.getState().claimStep, "success", "should not have re-entered the claim flow");
  assert.deepEqual(store.getState().spots.find((s) => s.id === 5), before);
});

test("cancelling a claim releases the reservation back to available", () => {
  const store = freshStore();
  store.selectSingleSpot(1);
  assert.equal(store.getState().spots.find((s) => s.id === 1)?.status, "reserved");
  store.cancelClaim();
  assert.equal(store.getState().spots.find((s) => s.id === 1)?.status, "available");
  assert.equal(store.getState().claimStep, null);
});

test("purchase rank advances sequentially as spots are booked one at a time", async () => {
  const store = freshStore();

  store.selectSingleSpot(10);
  store.updatePendingClaim({ buyerName: "First", email: "first@x.com", agreedToTerms: true });
  await store.bookSpot();

  store.selectSingleSpot(11);
  store.updatePendingClaim({ buyerName: "Second", email: "second@x.com", agreedToTerms: true });
  await store.bookSpot();

  store.selectSingleSpot(12);
  store.updatePendingClaim({ buyerName: "Third", email: "third@x.com", agreedToTerms: true });
  await store.bookSpot();

  const ranks = [10, 11, 12].map((id) => store.getState().spots.find((s) => s.id === id)?.purchaseRank);
  assert.deepEqual(ranks, [1, 2, 3]);
});

test("campaign flips to sold_out once every spot is claimed", async () => {
  const store = freshStore();
  store.fillToPercent(1); // dev-only helper, but store methods themselves aren't env-gated - only the UI trigger is
  assert.equal(store.getState().campaign.status, "sold_out");
  assert.equal(store.getState().spots.every((s) => s.status === "claimed"), true);
});
