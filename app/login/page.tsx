import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultRedirectForUser } from "@/lib/auth";
import { maranataKeyStartUrl } from "@/lib/maranata-key-sso";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redir?: string; mode?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(getDefaultRedirectForUser(user));
  }

  const { redir, mode } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maranata.app";
  const returnTo = new URL("/api/auth/callback", appUrl);
  if (redir?.startsWith("/")) {
    returnTo.searchParams.set("next", redir);
  }

  const nextMode =
    mode === "google" || mode === "password" || mode === "otp" ? mode : undefined;

  redirect(
    maranataKeyStartUrl(returnTo.toString(), {
      mode: nextMode,
      force: nextMode === "google",
    }),
  );
}
