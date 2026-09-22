/**
 * Abstraction every checkout call goes through. The UI and order logic
 * only ever talk to this interface, never to a specific provider's SDK,
 * so swapping providers later doesn't touch checkout code.
 *
 * Real flow this models (see PHASE 25 of the product spec):
 *   user selects spots -> backend creates a Reservation -> backend prices
 *   the order server-side -> createCheckoutSession() -> user pays with
 *   the provider -> provider calls the backend's webhook ->
 *   handleWebhook() verifies the signature and calls verifyPayment() ->
 *   the order is committed and spots flip to claimed.
 *
 * Nothing here is wired to a live account. MockPaymentProvider is what
 * the prototype actually runs today (a clearly-labelled test checkout,
 * matching the disclosure already shown in the checkout panel).
 * RazorpayPaymentProvider is the intended production target given the
 * founder is India-based selling internationally, stubbed out so the
 * shape is right when real keys are available - see README "Payment
 * provider integration steps" for what plugging it in for real requires
 * (a backend endpoint to hold the secret key; it must never ship in
 * client code).
 */
export interface CheckoutSession {
  id: string;
  amount: number;
  currency: string;
  /** URL/token the client would redirect to or open a widget with. Null for the mock provider, which resolves immediately. */
  redirectUrl: string | null;
}

export type PaymentStatus = "pending" | "succeeded" | "failed";

export interface PaymentResult {
  success: boolean;
  paymentId: string | null;
  error?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(orderId: string, amount: number, currency: string): Promise<CheckoutSession>;
  getPaymentStatus(sessionId: string): Promise<PaymentStatus>;
  /** Verifies a provider webhook payload's signature and returns the payment result it describes. Real implementations must reject unsigned/replayed events. */
  handleWebhook(payload: unknown, signature: string | null): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<boolean>;
  refundPayment(paymentId: string): Promise<boolean>;
}

/**
 * Stand-in for a real payment provider, used everywhere in this build.
 * Simulates the same async round trip a real checkout has (session
 * creation, a brief "processing" delay, a webhook-shaped result) so
 * swapping in a real provider later is a one-file change, not a
 * rewrite of state/appState.ts.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createCheckoutSession(orderId: string, amount: number, currency: string): Promise<CheckoutSession> {
    return { id: `mock_session_${orderId}`, amount, currency, redirectUrl: null };
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    return "succeeded";
  }

  async handleWebhook(): Promise<PaymentResult> {
    return { success: true, paymentId: `mock_pay_${Date.now()}` };
  }

  async verifyPayment(): Promise<boolean> {
    return true;
  }

  async refundPayment(): Promise<boolean> {
    return true;
  }

  /** Not part of the interface - the one method the prototype's checkout button actually calls, mirroring the old DemoPaymentService but now behind the shared abstraction. */
  async simulatePayment(orderId: string, amount: number, currency: string): Promise<PaymentResult> {
    await this.createCheckoutSession(orderId, amount, currency);
    await new Promise((resolve) => setTimeout(resolve, 700));
    return this.handleWebhook();
  }
}

/**
 * Razorpay is the recommended production target for an India-based
 * seller with international buyers (handles domestic KYC/compliance,
 * UPI + card acceptance, international card acceptance for global
 * buyers). NOT wired: real integration needs a backend route holding
 * RAZORPAY_KEY_SECRET (never in client code - see README env vars) that
 * creates orders via Razorpay's Orders API and verifies the
 * `razorpay_signature` HMAC on the webhook. This class exists so the
 * rest of the app already depends on the right shape; every method
 * throws until that backend route exists.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = "razorpay";

  private unconfigured(): never {
    throw new Error(
      "RazorpayPaymentProvider is not wired to a live account yet. It needs a backend endpoint holding " +
        "RAZORPAY_KEY_SECRET that creates/verifies orders - see the README's payment provider integration steps.",
    );
  }

  async createCheckoutSession(): Promise<CheckoutSession> {
    this.unconfigured();
  }
  async getPaymentStatus(): Promise<PaymentStatus> {
    this.unconfigured();
  }
  async handleWebhook(): Promise<PaymentResult> {
    this.unconfigured();
  }
  async verifyPayment(): Promise<boolean> {
    this.unconfigured();
  }
  async refundPayment(): Promise<boolean> {
    this.unconfigured();
  }
}
