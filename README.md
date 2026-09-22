# dibs.lol

200 spots. One jersey. Every claim makes the next one pricier.

Live: https://jarjishsiddibapa.github.io/jersey-test/

## What this is right now

A polished, fully-functional **prototype**: real pricing logic, real spot
geometry, real client-side validation, a real booking flow you can
actually complete end to end (one spot per claim - fill the form, click
Book, it's yours), public shareable spot pages, and an architecture
already shaped like the production system described below - but with no
live database, no live payment provider, no live email, and no real
object storage. Persistence is per-browser `localStorage`. See
"Definition of done" at the bottom for exactly what's real vs. simulated.

## Stack

Vite + vanilla TypeScript, no framework. `src/state/appState.ts` is the
single source of truth (subscribe/render, full DOM rebuild per state
change). `src/components/*` are pure render functions returning HTML
strings; all interactivity is event delegation on `document` in
`src/main.ts`. `src/services/*` hold the business logic and the
provider-interface seams (payments, storage, email, analytics).

## Commands

```bash
npm run dev      # local dev server
npm run build     # tsc typecheck + production build to dist/
npm test          # Node's built-in test runner against src/**/*.test.ts
npm run preview   # serve the production build locally
```

## Pricing model

```
basePriceForRank(n) = startingPrice * (1 + growthRate) ^ (n - 1)
finalPrice(spot)     = basePriceForRank(spot.purchaseRank) * TIER_MULTIPLIER[spot.tier]
```

`startingPrice = $0.10`, `growthRate = 0.06` (+6% per claim, edition-wide -
not per tier, not per day), no cap. Tier multipliers: standard 1x,
premium 3x, hero 5x. There is ONE global purchase-rank counter, shared
across every spot claimed regardless of tier. The UI only lets a visitor
claim one spot at a time; `priceSelection()` (in `src/services/pricing.ts`)
is written to price an array of spot ids so the same rank logic can back
a multi-spot checkout later without a rewrite, but nothing in the UI
exposes that today. See `src/services/pricing.ts` and its test file for
the exact formulas and worked examples.

## Architecture-ready, not wired

These exist as real interfaces with a working local/mock implementation,
specifically so a real backend is a provider swap, not a rewrite:

- `src/services/paymentProvider.ts` - `PaymentProvider` interface,
  `MockPaymentProvider` (what runs today), `RazorpayPaymentProvider`
  (stub - throws until wired; Razorpay was chosen as the target because
  the founder is India-based selling internationally).
- `src/services/storageProvider.ts` - `StorageProvider` interface for
  logo assets; `LocalStorageProvider` keeps them as data: URLs today.
- `src/services/emailProvider.ts` - `EmailProvider` interface;
  `ConsoleEmailProvider` just logs in dev today.
- `src/services/repository.ts` - `SpotRepository` interface over
  campaign/spots/activity/orders/buyers; `LocalSpotRepository` is
  localStorage-backed today.
- `src/services/reservationService.ts` - 10-minute spot holds. Real
  double-claim prevention across DIFFERENT visitors needs a database
  transaction/unique constraint on the backend - this only coordinates
  within one browser tab today (see "Remaining risks").
- `src/services/orderService.ts` - builds the Order/OrderItem records a
  real order history would store, from the same pricing function the UI
  displays.

## Database schema (MySQL - the user has MySQL installed locally)

```sql
CREATE TABLE campaigns (
  id VARCHAR(40) PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  total_spots INT NOT NULL,
  starting_price DECIMAL(12,6) NOT NULL,
  growth_rate DECIMAL(6,4) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('draft','live','paused','sold_out','archived') NOT NULL DEFAULT 'draft',
  launch_at DATETIME NOT NULL,
  closed_at DATETIME NULL
);

CREATE TABLE spots (
  id INT NOT NULL,
  campaign_id VARCHAR(40) NOT NULL REFERENCES campaigns(id),
  x INT NOT NULL, y INT NOT NULL, width INT NOT NULL, height INT NOT NULL,
  region ENUM('chest','sleeve','lower','shoulder') NOT NULL,
  tier ENUM('standard','premium','hero') NOT NULL,
  status ENUM('available','reserved','claimed') NOT NULL DEFAULT 'available',
  buyer_id VARCHAR(40) NULL REFERENCES buyers(id),
  order_id VARCHAR(40) NULL REFERENCES orders(id),
  logo_storage_key VARCHAR(200) NULL,
  website VARCHAR(500) NULL,
  tagline VARCHAR(90) NULL,
  price_paid DECIMAL(14,6) NULL,
  purchase_rank INT NULL,
  purchased_at DATETIME NULL,
  moderation_status ENUM('pending','approved','rejected','disabled') NULL,
  profile_views INT NOT NULL DEFAULT 0,
  outbound_clicks INT NOT NULL DEFAULT 0,
  PRIMARY KEY (campaign_id, id),
  UNIQUE KEY uniq_rank_per_campaign (campaign_id, purchase_rank)
);

CREATE TABLE buyers (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  company VARCHAR(120) NULL,
  email VARCHAR(255) NOT NULL,
  website VARCHAR(500) NULL,
  country CHAR(2) NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE orders (
  id VARCHAR(40) PRIMARY KEY,
  campaign_id VARCHAR(40) NOT NULL REFERENCES campaigns(id),
  buyer_id VARCHAR(40) NOT NULL REFERENCES buyers(id),
  amount DECIMAL(14,6) NOT NULL,
  currency CHAR(3) NOT NULL,
  payment_provider VARCHAR(40) NOT NULL,
  payment_id VARCHAR(120) NULL UNIQUE,
  status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  paid_at DATETIME NULL,
  refunded_at DATETIME NULL
);

CREATE TABLE order_items (
  order_id VARCHAR(40) NOT NULL REFERENCES orders(id),
  spot_id INT NOT NULL,
  campaign_id VARCHAR(40) NOT NULL,
  purchase_rank INT NOT NULL,
  tier ENUM('standard','premium','hero') NOT NULL,
  unit_base_price DECIMAL(14,6) NOT NULL,
  tier_multiplier DECIMAL(4,2) NOT NULL,
  final_price DECIMAL(14,6) NOT NULL,
  PRIMARY KEY (order_id, spot_id)
);

CREATE TABLE reservations (
  spot_id INT NOT NULL,
  campaign_id VARCHAR(40) NOT NULL,
  buyer_session_id VARCHAR(80) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (campaign_id, spot_id)
);

CREATE TABLE click_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  spot_id INT NOT NULL,
  campaign_id VARCHAR(40) NOT NULL,
  kind ENUM('profile_view','outbound_click') NOT NULL,
  utm_source VARCHAR(120) NULL,
  utm_medium VARCHAR(120) NULL,
  utm_campaign VARCHAR(120) NULL,
  referrer VARCHAR(500) NULL,
  created_at DATETIME NOT NULL
);
```

Order amounts are immutable once paid - never recompute a historical
order from current pricing config.

## API endpoints a real backend needs

```
GET   /api/campaigns/:slug                    campaign + current/next base price
GET   /api/campaigns/:slug/spots               all spots (status, tier, buyer display info)
POST  /api/campaigns/:slug/reservations         { spotIds } -> reservation(s), 10 min TTL
DELETE /api/reservations/:spotId                release early (cancel)
POST  /api/orders                               { reservationIds, buyer } -> order (server prices it)
POST  /api/orders/:id/checkout-session          -> Razorpay checkout session
POST  /api/webhooks/razorpay                    signature-verified payment webhook -> commits order, flips spots to claimed
GET   /api/spots/:campaignSlug/:spotId          public spot page data
POST  /api/spots/:campaignSlug/:spotId/click    { kind: 'profile_view' | 'outbound_click' }
POST  /api/admin/moderation/:spotId             { status } - requires admin/moderator auth
GET   /api/admin/orders, /api/admin/buyers, /api/admin/analytics   - requires admin auth
```

## Environment variables (none of these are set today - nothing is wired)

```
VITE_SITE_URL          # production origin, e.g. https://theinternetjersey.com - drives every share/canonical/OG URL (services/urls.ts). Unset today; falls back to window.location.
DATABASE_URL            # MySQL connection string (server-side only)
RAZORPAY_KEY_ID          # public, safe for client
RAZORPAY_KEY_SECRET      # server-side ONLY, never in client code
RAZORPAY_WEBHOOK_SECRET  # server-side ONLY, verifies webhook signatures
STORAGE_BUCKET_URL/KEYS  # wherever logos end up (S3-compatible, Supabase storage, etc.)
EMAIL_PROVIDER_API_KEY   # transactional email (Postmark/SES/Resend/...)
ADMIN_SESSION_SECRET     # once real admin auth exists
```

## Payment provider integration steps (Razorpay)

1. Stand up a minimal backend (any Node server) that holds
   `RAZORPAY_KEY_SECRET` - it must never reach the client bundle.
2. Implement `POST /api/orders/:id/checkout-session` calling Razorpay's
   Orders API server-side, returning the client-safe order/session id.
3. Implement the webhook endpoint, verifying `X-Razorpay-Signature`
   against `RAZORPAY_WEBHOOK_SECRET` before trusting the payload.
4. Replace `MockPaymentProvider` with a real `RazorpayPaymentProvider`
   in `src/state/appState.ts` (one line) - `bookSpot()` and every caller
   already expect the same `PaymentProvider` interface. Note that wiring
   a real provider also means the UI needs an actual payment step again
   (today `bookSpot()` finalizes the claim directly, since there's
   nothing real to collect yet).
5. Move price calculation server-side: the webhook handler should
   recompute the order amount from the authoritative current rank, not
   trust anything the client sent.

## Storage / email / admin configuration

- **Storage**: pick an S3-compatible bucket or Supabase/Firebase storage,
  implement `StorageProvider.uploadLogo` against it, swap
  `LocalStorageProvider` in `appState.ts`.
- **Email**: pick a transactional provider, implement `EmailProvider`,
  swap `ConsoleEmailProvider`.
- **Admin**: there is no real authentication yet. `components/devTools.ts`
  is a local-only, `import.meta.env.DEV`-gated panel - NOT an admin
  dashboard, and it's compiled out of production builds entirely (see
  "Definition of done"). A real admin needs real auth (session or OAuth)
  and role checks (ADMIN vs MODERATOR) before any of its actions are
  exposed over the network.

## How to seed a DEVELOPMENT environment safely

Run `npm run dev`, open the site, and use the "Dev tools" link in the
footer (only rendered in dev mode) - "Seed 30 demo buyers", "Fill to
X%", etc. This data never leaves your browser's localStorage and is
literally absent from any production build (verified by grepping
`dist/assets/*.js` for the dev-tools strings - see commit message).

## How to deploy PRODUCTION without demo data

`npm run build` already produces a build with zero demo/seed code paths
reachable (they're dead-code-eliminated because `import.meta.env.DEV` is
statically `false`). The current GitHub Actions workflow
(`.github/workflows/deploy.yml`) already does exactly this on every push
to `main`. Nothing extra to do until a real backend/payment
provider/domain is wired - at that point, set `VITE_SITE_URL` and the
backend env vars above as repository/host secrets, not in the repo.

## Test checklist

- [x] `npm test` - 35 automated tests: spot generation invariants (exact
      200, sequential IDs, 160/28/12 tier split, no overlaps, silhouette
      safety), pricing formula against the spec's worked examples,
      sequential rank consumption across one-spot-at-a-time bookings,
      every claim-form validation (name/email/website/length/rules
      agreement), XSS/attribute-injection resistance, logo upload
      MIME+signature+size validation, double-claim rejection, reservation
      release on cancel.
- [x] `npx tsc --noEmit` - clean, strict mode.
- [x] `npm run build` - clean production build.
- [x] Manually verified in-browser: single-spot claim-to-book flow
      (select a spot, fill the form, submit, land straight on the success
      panel - no separate checkout/payment screen), sequential rank
      pricing across consecutive bookings, success panel, public spot
      page via hash routing, outbound click tracking, the Rules page, 404
      spot handling, inline validation errors, Escape-to-cancel releases
      the reservation, keyboard Enter/Space activation, modal focus trap,
      mobile viewport (375px) with no horizontal scroll and a
      non-overlapping sticky CTA, dev-tools panel + moderation
      approve/reject (dev mode only).
- [ ] NOT tested (needs real infrastructure): actual Razorpay payment,
      actual concurrent double-claim across two real browsers/devices,
      actual webhook replay/signature verification, actual email
      delivery, real load/performance testing.

## Remaining risks / known gaps

1. **No real backend.** Every "server-authoritative" calculation
   currently runs in the visitor's own browser. Two different visitors
   CAN both successfully claim the same spot today (each browser only
   knows its own localStorage) - the reservation system only prevents
   this within a single tab. This is the single biggest gap before a
   real paid launch.
2. **Dead code, not deleted code.** Dev-only store methods
   (`seedDemoBuyers`, `fillToCount`, etc.) are gated at the UI/dispatch
   layer, not removed from the `AppStore` class - they're unreachable in
   production but still shipped as inert code. Low risk (can only affect
   the calling visitor's own local session) but worth knowing.
3. **No real image sanitization pipeline.** Logos are re-encoded via
   `<canvas>` client-side (which strips most attack surface by
   construction) plus a magic-byte check, but there's no server-side
   scan. SVG uploads are rejected outright rather than sanitized.
4. **OG/canonical metadata is static per session, not per-crawler-request.**
   Hash-based routing means a non-JS crawler sees the same meta tags for
   every route. Real per-spot social previews need either prerendering
   at build time or a small server - both require the backend that
   doesn't exist yet.
5. **No legal review.** The Rules page is real, considered content - not
   a placeholder - but it's intentionally lightweight (pricing, what you
   can submit, moderation) and has not been reviewed by a lawyer. Get a
   proper Terms/Privacy review before taking real money.
6. **No rate limiting / bot protection** on the (currently client-only)
   booking flow - relevant once a real payment endpoint exists.

## What still requires manual configuration

Domain purchase + DNS, a MySQL host (or managed Postgres/Supabase if
preferred later), a Razorpay business account (KYC), an object storage
bucket, a transactional email account, and a real admin authentication
system. None of this can be provisioned from within this session - it
needs your own accounts and credentials, passed in as environment
variables, never committed to the repo.

## Definition of done

Exactly 200 spots (160/28/12 tier split) ✅ &middot; $0.10 start / 6%
growth / no cap ✅ &middot; current price from... this browser's own
state, not a real server ⚠️ &middot; booking is simulated, no real money
moves ⚠️ &middot; reservations exist but don't stop cross-browser
double-claims ⚠️ &middot; logos are securely validated client-side, not
centrally moderated ⚠️ &middot; public spot pages ✅ &middot; sharing ✅
&middot; analytics scaffold (console-only) ⚠️ &middot; referral
attribution capture ✅ &middot; Rules page ✅ (un-reviewed) &middot; admin
auth ❌ &middot; prototype tools absent from production build ✅ &middot;
fake buyers/activity/scarcity absent from production ✅ &middot; mobile ✅
&middot; keyboard access ✅ &middot; automated tests passing ✅ &middot;
build passing ✅ &middot; deployment passing ✅.

**This is a trustworthy, well-tested prototype with production-shaped
architecture. It is not yet a live, transactional product** - that
transition needs the real backend, payment account, and legal review
listed above.
