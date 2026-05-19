export type Safe2PayMode = "stub" | "sandbox" | "production";

export function getSafe2PayMode(): Safe2PayMode {
  const explicit = process.env.SAFE2PAY_MODE?.toLowerCase();
  if (explicit === "stub" || explicit === "sandbox" || explicit === "production") {
    return explicit;
  }
  if (!process.env.SAFE2PAY_API_KEY) return "stub";
  return process.env.NODE_ENV === "production" ? "production" : "sandbox";
}

export function getSafe2PayBaseUrl(): string {
  const explicit = process.env.SAFE2PAY_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  return getSafe2PayMode() === "production"
    ? "https://api.safe2pay.com.br"
    : "https://payment.safe2pay.com.br";
}

export function getSafe2PayApiKey(): string {
  const key = process.env.SAFE2PAY_API_KEY;
  if (!key) throw new Error("SAFE2PAY_API_KEY ausente");
  return key;
}

export function getWebhookSecret(): string | null {
  return process.env.SAFE2PAY_WEBHOOK_SECRET || null;
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://maranata.app").replace(/\/$/, "");
}
