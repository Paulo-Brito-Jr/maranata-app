/**
 * Cliente HTTP do Maranata Suite (maranata-key) — resolve membership.
 * Doc: maranata-key/docs/SUITE-CLIENT-TEMPLATE.md
 */
const SUITE_URL = process.env.MARANATA_SUITE_URL ?? process.env.MARANATA_KEY_URL ?? "https://maranata-key.vercel.app";
const KEY = process.env.MARANATA_INTEGRATION_KEY ?? "";

export type SuiteRole =
  | "SUPER_ADMIN" | "PASTOR_DIRETORIA" | "ADMIN_IGREJA" | "LIDER_CELULA"
  | "SECRETARIA" | "FINANCEIRO" | "KIDS_RESPONSAVEL" | "ADMIN" | "MEMBRO" | "OBSERVER";

export type SuitePapelApp = "ADMIN" | "USUARIO" | "VIEWER";

export type EffectiveApp = {
  slug: string;
  nome: string;
  url: string | null;
  papel: SuitePapelApp;
  via: "direct" | "group";
};

export type Membership = {
  id: string;
  email: string;
  name: string;
  role: SuiteRole;
  coreUserId: string | null;
  coreChurchId: string | null;
  ativo: boolean;
  groups: string[];
  apps: EffectiveApp[];
};

export async function getMembership(email: string): Promise<Membership | null> {
  if (!KEY) {
    console.warn("[maranata-suite] MARANATA_INTEGRATION_KEY ausente");
    return null;
  }
  try {
    const r = await fetch(`${SUITE_URL}/api/membership/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${KEY}`, "x-source": "maranata-app" },
      next: { revalidate: 60, tags: [`suite:membership:${email}`] },
    });
    if (r.status === 404) return null;
    if (!r.ok) {
      console.warn(`[maranata-suite] /api/membership → ${r.status}`);
      return null;
    }
    return (await r.json()) as Membership;
  } catch (err) {
    console.warn("[maranata-suite] falha:", err);
    return null;
  }
}

export async function hasAppAccess(
  email: string,
  appSlug: string,
  minPapel: SuitePapelApp = "VIEWER",
): Promise<boolean> {
  const m = await getMembership(email);
  if (!m || !m.ativo) return false;
  const app = m.apps.find((a) => a.slug === appSlug);
  if (!app) return false;
  const rank = { VIEWER: 1, USUARIO: 2, ADMIN: 3 } as const;
  return rank[app.papel] >= rank[minPapel];
}

export async function inGroup(email: string, groupSlug: string): Promise<boolean> {
  const m = await getMembership(email);
  return !!m?.groups.includes(groupSlug);
}
