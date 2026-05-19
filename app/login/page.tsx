import Link from "next/link";
import { maranataKeyLogoutUrl, maranataKeyStartUrl } from "@/lib/maranata-key-sso";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redir?: string }>;
}) {
  const { redir } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maranata.app";
  const returnTo = `${appUrl}/api/auth/callback?next=${encodeURIComponent(redir ?? "/")}`;
  const ssoUrl = maranataKeyStartUrl(returnTo);
  const googleUrl = maranataKeyStartUrl(returnTo, { mode: "google", force: true });
  const senhaUrl = maranataKeyStartUrl(returnTo, { mode: "password", force: true });
  const outraContaUrl = maranataKeyLogoutUrl(`${appUrl}/login?redir=${encodeURIComponent(redir ?? "/")}`);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
      <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto size-14 rounded-full bg-brand-orange/90" aria-hidden />
          <h1 className="mt-5 text-2xl font-semibold text-white">Maranata App</h1>
          <p className="mt-2 text-sm text-white/70">
            Entre com sua conta da Maranata Key
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          <Link
            href={googleUrl}
            className="flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-white/90"
          >
            Entrar com Google
          </Link>
          <Link
            href={ssoUrl}
            className="flex w-full items-center justify-center rounded-full bg-brand-orange px-6 py-3 text-base font-medium text-brand-orange-foreground shadow-lg shadow-brand-orange/40 transition hover:opacity-90"
          >
            Entrar com Maranata Key
          </Link>
          <Link
            href={senhaUrl}
            className="flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10"
          >
            Entrar com email e senha
          </Link>
          <Link href={outraContaUrl} className="text-center text-sm text-white/60 transition hover:text-white">
            Entrar com outra conta
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          Plataforma exclusiva da IGREJA MISSIONÁRIA EVANGÉLICA MARANATA
        </p>
      </div>
    </main>
  );
}
