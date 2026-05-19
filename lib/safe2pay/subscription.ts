import { nanoid } from "nanoid";
import { getAppUrl, getSafe2PayMode } from "./config";
import { safe2payFetch } from "./client";
import type { SubscriptionRequest, SubscriptionResponse } from "./types";

export async function createSubscription(input: SubscriptionRequest): Promise<SubscriptionResponse> {
  if (getSafe2PayMode() === "stub") {
    const sub = `stub_sub_${nanoid(10)}`;
    return {
      subscriptionId: sub,
      status: "PENDING",
      checkoutUrl: `${getAppUrl()}/doar/checkout-stub?ref=${encodeURIComponent(input.reference)}&sub=${sub}`,
    };
  }

  const payload = {
    Reference: input.reference,
    Amount: input.amount,
    Frequency: input.frequency,
    StartDate: input.startDate,
    WebhookUrl: input.webhookUrl,
    Customer: {
      Name: input.customer.name,
      Email: input.customer.email,
      Phone: input.customer.phone,
      Identity: input.customer.document,
    },
  };

  const res = await safe2payFetch<{ ResponseDetail?: { IdSubscription?: string; Status?: string; CheckoutUrl?: string } }>(
    "/v2/Subscription",
    { method: "POST", body: JSON.stringify(payload) },
  );

  const detail = res.ResponseDetail;
  if (!detail?.IdSubscription) {
    throw new Error("Safe2Pay subscription: resposta sem IdSubscription");
  }
  return {
    subscriptionId: detail.IdSubscription,
    status: (detail.Status as SubscriptionResponse["status"]) ?? "PENDING",
    checkoutUrl: detail.CheckoutUrl,
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (getSafe2PayMode() === "stub") return;
  await safe2payFetch(`/v2/Subscription/${subscriptionId}/Cancel`, { method: "POST" });
}
