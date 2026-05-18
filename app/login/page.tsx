import Link from "next/link";
import { maranataKeyStartUrl } from "@/lib/maranata-key-sso";

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

        <Link
          href={ssoUrl}
          className="mt-8 flex w-full items-center justify-center rounded-full bg-brand-orange px-6 py-3 text-base font-medium text-brand-orange-foreground shadow-lg shadow-brand-orange/40 transition hover:opacity-90"
        >
          Entrar com Maranata Key
        </Link>

        <p className="mt-6 text-center text-xs text-white/50">
          Plataforma exclusiva da IGREJA MISSIONÁRIA EVANGÉLICA MARANATA
        </p>
      </div>
    </main>
  );
}
