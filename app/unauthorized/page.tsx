import Link from "next/link";
import { getCurrentUser, getRealUser, ROTULO_PAPEL, isPapelValido } from "@/lib/auth";
import { RoleBadge } from "@/components/role-badge";
import { ImpersonarSair } from "@/components/impersonar-controls";

export const metadata = { title: "Sem permissão" };
export const dynamic = "force-dynamic";

type Search = { from?: string; papel?: string };

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const [user, real] = await Promise.all([getCurrentUser(), getRealUser()]);
  const papelMostrar = isPapelValido(sp.papel) ? sp.papel : user?.role;
  const impersonandoAtivo = user?.impersonando !== undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-6xl">🚫</div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Sem permissão</h1>

      {papelMostrar ? (
        <p className="mt-3 text-muted-foreground">
          Seu papel atual{" "}
          <span className="inline-flex translate-y-0.5">
            <RoleBadge role={papelMostrar} size="xs" />
          </span>{" "}
          não tem acesso a{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
            {sp.from ?? "esta área"}
          </code>
          .
        </p>
      ) : (
        <p className="mt-3 text-muted-foreground">
          Sua conta não tem acesso a esta área. Se for engano, fale com a administração.
        </p>
      )}

      {impersonandoAtivo && (
        <div className="mt-6 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-left text-sm text-yellow-200">
          <p className="font-medium">Você está em modo teste como {ROTULO_PAPEL[user!.role!]}.</p>
          <p className="mt-1 text-yellow-300/80">
            Seu papel real é{" "}
            {real?.role ? ROTULO_PAPEL[real.role] : "desconhecido"}. Pra voltar ao admin, saia do
            modo teste.
          </p>
          <div className="mt-3">
            <ImpersonarSair texto="Sair do modo teste e voltar" />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/membro"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Ir pra área do membro
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-secondary"
        >
          Voltar pra Home
        </Link>
      </div>
    </main>
  );
}
