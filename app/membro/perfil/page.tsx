import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { dataPtBR } from "@/lib/utils";
import { SairButton } from "./sair-button";

export const metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

const PAPEL_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  PASTOR_DIRETORIA: "Pastor da diretoria",
  ADMIN_IGREJA: "Admin da igreja",
  LIDER_CELULA: "Líder de célula",
  SECRETARIA: "Secretaria",
  FINANCEIRO: "Financeiro",
  KIDS_RESPONSAVEL: "Responsável Kids",
  MEMBRO: "Membro",
};

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function MembroPerfil() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/perfil");

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    include: {
      igreja: { select: { nome: true } },
      participacoes: {
        where: { ativo: true },
        include: { celula: { select: { nome: true } } },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-blue text-2xl font-bold text-white shadow-lg">
          {iniciais(user.name)}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {user.role && (
          <span className="mt-2 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-medium text-primary">
            {PAPEL_LABEL[user.role] ?? user.role}
          </span>
        )}
      </section>

      {membro && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Vínculo Maranata
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Igreja</dt>
              <dd className="font-medium">{membro.igreja.nome}</dd>
            </div>
            {membro.participacoes.length > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Célula</dt>
                <dd className="font-medium">
                  {membro.participacoes[0].celula.nome}
                </dd>
              </div>
            )}
            {membro.dataBatismo && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Batismo</dt>
                <dd className="font-medium">{dataPtBR(membro.dataBatismo)}</dd>
              </div>
            )}
            {membro.dataNascimento && (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Nascimento</dt>
                <dd className="font-medium">
                  {dataPtBR(membro.dataNascimento)}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Atalhos
        </h2>
        <div className="mt-3 space-y-1">
          <Link
            href="/membro/oracao"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-secondary/50"
          >
            <span>Meus pedidos de oração</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link
            href="/membro/celula"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-secondary/50"
          >
            <span>Minha célula</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link
            href="/membro/testemunhos"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-secondary/50"
          >
            <span>Compartilhar testemunho</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          {user.role &&
            ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"].includes(
              user.role,
            ) && (
              <Link
                href="/admin"
                className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
              >
                <span>🛠 Painel administrativo</span>
                <span>→</span>
              </Link>
            )}
        </div>
      </section>

      <SairButton />
    </div>
  );
}
