import { cookies } from "next/headers";
import { verifyMaranataKeyToken, type MKUser, type MKRole } from "./maranata-key-sso";

export const SESSION_COOKIE = "maranata_app_session";
export const IMPERSONA_COOKIE = "maranata_app_impersona";

export type EffectiveUser = MKUser & { impersonando?: MKRole | undefined };

const PAPEIS_VALIDOS: ReadonlyArray<MKRole> = [
  "SUPER_ADMIN",
  "PASTOR_DIRETORIA",
  "ADMIN_IGREJA",
  "LIDER_CELULA",
  "SECRETARIA",
  "FINANCEIRO",
  "KIDS_RESPONSAVEL",
  "MEMBRO",
];

export function isPapelValido(value: string | undefined): value is MKRole {
  return !!value && (PAPEIS_VALIDOS as readonly string[]).includes(value);
}

export async function getCurrentUser(): Promise<EffectiveUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await verifyMaranataKeyToken(token);
  if (!user) return null;

  if (user.role === "SUPER_ADMIN") {
    const imp = store.get(IMPERSONA_COOKIE)?.value;
    if (isPapelValido(imp) && imp !== "SUPER_ADMIN") {
      return { ...user, role: imp, impersonando: imp };
    }
  }
  return user;
}

export async function getRealUser(): Promise<MKUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyMaranataKeyToken(token);
}

export async function requireRole(...roles: MKRole[]): Promise<EffectiveUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (roles.length > 0 && (!user.role || !roles.includes(user.role))) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function getDefaultRedirectForUser(user: Pick<MKUser, "role"> | null | undefined): string {
  return rolesPodemAdministrar(user?.role) ? "/admin" : "/membro";
}

export function rolesPodemAdministrar(role: MKRole | undefined): boolean {
  if (!role) return false;
  return ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"].includes(role);
}

export const ROTULO_PAPEL: Record<MKRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR_DIRETORIA: "Pastor / Diretoria",
  ADMIN_IGREJA: "Admin Igreja",
  LIDER_CELULA: "Líder Célula",
  SECRETARIA: "Secretaria",
  FINANCEIRO: "Financeiro",
  KIDS_RESPONSAVEL: "Kids — Responsável",
  MEMBRO: "Membro",
};
