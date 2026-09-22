export interface PaymentResult {
  success: boolean;
}

/**
 * Stand-in for a real payment provider. Production would swap this for a
 * RealPaymentService that talks to a payment webhook; the calling code
 * (state/appState.ts) doesn't need to change.
 */
export class DemoPaymentService {
  async simulatePayment(): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { success: true };
  }
}
