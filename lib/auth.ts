import { cookies } from "next/headers";
import { verifyMaranataKeyToken, type MKUser, type MKRole } from "./maranata-key-sso";

export const SESSION_COOKIE = "maranata_app_session";

export async function getCurrentUser(): Promise<MKUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyMaranataKeyToken(token);
}

export async function requireRole(...roles: MKRole[]): Promise<MKUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (roles.length > 0 && (!user.role || !roles.includes(user.role))) {
    if (user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  }
  return user;
}

export function rolesPodemAdministrar(role: MKRole | undefined): boolean {
  if (!role) return false;
  return ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"].includes(role);
}
