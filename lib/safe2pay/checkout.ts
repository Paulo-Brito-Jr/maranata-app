import { nanoid } from "nanoid";
import { getAppUrl, getSafe2PayMode } from "./config";
import { safe2payFetch } from "./client";
import type { CheckoutRequest, CheckoutResponse } from "./types";

export async function createCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
  if (getSafe2PayMode() === "stub") {
    const tx = `stub_${nanoid(10)}`;
    return {
      checkoutUrl: `${getAppUrl()}/doar/checkout-stub?ref=${encodeURIComponent(input.reference)}&tx=${tx}`,
      transactionId: tx,
    };
  }

  const payload = {
    Reference: input.reference,
    Amount: input.amount,
    Description: input.description,
    CallbackUrl: input.callbackUrl,
    WebhookUrl: input.webhookUrl,
    Customer: {
      Name: input.customer.name,
      Email: input.customer.email,
      Phone: input.customer.phone,
      Identity: input.customer.document,
    },
    PaymentMethods: input.paymentMethods ?? ["PIX", "CREDIT_CARD"],
  };

  const res = await safe2payFetch<{ ResponseDetail?: { CheckoutUrl?: string; IdTransaction?: string; ExpiresAt?: string } }>(
    "/v2/Checkout",
    { method: "POST", body: JSON.stringify(payload) },
  );

  const detail = res.ResponseDetail;
  if (!detail?.CheckoutUrl || !detail.IdTransaction) {
    throw new Error("Safe2Pay checkout: resposta sem CheckoutUrl/IdTransaction");
  }
  return {
    checkoutUrl: detail.CheckoutUrl,
    transactionId: detail.IdTransaction,
    expiresAt: detail.ExpiresAt,
  };
}
