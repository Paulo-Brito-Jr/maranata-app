import { getSafe2PayApiKey, getSafe2PayBaseUrl, getSafe2PayMode } from "./config";

export class Safe2PayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "Safe2PayError";
  }
}

export async function safe2payFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const mode = getSafe2PayMode();
  if (mode === "stub") {
    throw new Safe2PayError("Safe2Pay em modo stub — não chama API externa", 0, null);
  }

  const url = `${getSafe2PayBaseUrl()}${path}`;
  const headers = new Headers(init.headers);
  headers.set("X-API-KEY", getSafe2PayApiKey());
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    throw new Safe2PayError(`Safe2Pay ${res.status} ${path}`, res.status, parsed);
  }

  return parsed as T;
}
