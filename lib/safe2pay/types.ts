export type Safe2PayPaymentMethod = "PIX" | "CREDIT_CARD" | "BOLETO";

export type Safe2PayStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED"
  | "UNKNOWN";

export interface CheckoutRequest {
  reference: string;
  amount: number;
  description: string;
  callbackUrl: string;
  webhookUrl: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  paymentMethods?: Safe2PayPaymentMethod[];
}

export interface CheckoutResponse {
  checkoutUrl: string;
  transactionId: string;
  expiresAt?: string;
}

export interface SubscriptionRequest {
  reference: string;
  amount: number;
  frequency: "MONTHLY" | "ANNUAL";
  customer: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  startDate?: string;
  webhookUrl: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  status: "ACTIVE" | "PENDING" | "FAILED";
  checkoutUrl?: string;
}

export interface WebhookEvent {
  transactionId?: string;
  subscriptionId?: string;
  reference?: string;
  status: Safe2PayStatus;
  amount?: number;
  paidAt?: string;
  raw: Record<string, unknown>;
}
