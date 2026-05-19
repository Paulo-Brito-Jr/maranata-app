const MK = process.env.MARANATA_KEY_URL ?? "https://maranata-key.vercel.app";
const APP_ID = process.env.MARANATA_KEY_APP_ID ?? "maranata-app";

export type MKRole =
  | "SUPER_ADMIN"
  | "PASTOR_DIRETORIA"
  | "ADMIN_IGREJA"
  | "LIDER_CELULA"
  | "SECRETARIA"
  | "FINANCEIRO"
  | "KIDS_RESPONSAVEL"
  | "MEMBRO";

export type MKUser = {
  sub: string;
  email: string;
  name: string;
  role?: MKRole;
  igrejaId?: string;
};

export type MaranataKeyLoginMode = "mk" | "google" | "password" | "otp";

export function maranataKeyStartUrl(
  returnUrl: string,
  options: { mode?: MaranataKeyLoginMode; force?: boolean } = {},
): string {
  const u = new URL(`${MK}/api/sso/start`);
  u.searchParams.set("app", APP_ID);
  u.searchParams.set("return", returnUrl);
  if (options.mode && options.mode !== "mk") u.searchParams.set("mode", options.mode);
  if (options.force) u.searchParams.set("force", "1");
  return u.toString();
}

export function maranataKeyLogoutUrl(returnUrl: string): string {
  const u = new URL(`${MK}/api/sso/logout`);
  u.searchParams.set("app", APP_ID);
  u.searchParams.set("return", returnUrl);
  return u.toString();
}

export async function verifyMaranataKeyToken(token: string): Promise<MKUser | null> {
  try {
    const r = await fetch(`${MK}/api/auth/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { valid: boolean; user?: MKUser };
    return j.valid && j.user ? j.user : null;
  } catch {
    return null;
  }
}
