import { createHmac, timingSafeEqual } from "crypto";
import { getWebhookSecret } from "./config";

export interface SignatureVerification {
  valid: boolean;
  reason?: string;
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): SignatureVerification {
  const secret = getWebhookSecret();
  if (!secret) {
    return { valid: true, reason: "secret_not_configured" };
  }
  if (!signatureHeader) {
    return { valid: false, reason: "missing_signature_header" };
  }

  const provided = signatureHeader.replace(/^sha256=/i, "").trim();
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (provided.length !== expected.length) {
    return { valid: false, reason: "length_mismatch" };
  }

  try {
    const eq = timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
    return eq ? { valid: true } : { valid: false, reason: "hmac_mismatch" };
  } catch {
    return { valid: false, reason: "invalid_hex" };
  }
}

export function mapSafe2PayStatus(raw: unknown): import("./types").Safe2PayStatus {
  if (typeof raw !== "string" && typeof raw !== "number") return "UNKNOWN";
  const s = String(raw);
  switch (s) {
    case "Paid":
    case "3":
      return "PAID";
    case "Authorized":
    case "2":
      return "AUTHORIZED";
    case "Cancelled":
    case "Canceled":
    case "5":
      return "CANCELLED";
    case "Refunded":
    case "6":
      return "REFUNDED";
    case "Failed":
    case "4":
      return "FAILED";
    case "Pending":
    case "1":
      return "PENDING";
    default:
      return "UNKNOWN";
  }
}
