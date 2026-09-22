import type { Order } from "../types";

/**
 * Transactional email seam. No real provider (Postmark, SES, Resend,
 * etc.) is wired up - see README "Email configuration". The console
 * implementation is what runs today so the confirmation flow can still
 * be exercised end-to-end in dev without lying about sending anything.
 */
export interface EmailProvider {
  sendPurchaseConfirmation(order: Order, toEmail: string, spotUrls: string[]): Promise<void>;
}

export class ConsoleEmailProvider implements EmailProvider {
  async sendPurchaseConfirmation(order: Order, toEmail: string, spotUrls: string[]): Promise<void> {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[email:mock] purchase confirmation for order ${order.id} -> ${toEmail}`, spotUrls);
    }
  }
}
