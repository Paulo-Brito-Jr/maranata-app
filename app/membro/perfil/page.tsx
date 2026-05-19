import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { dataPtBR } from "@/lib/utils";
import { RoleBadge } from "@/components/role-badge";
import { SairButton } from "./sair-button";

export const metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

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
        {membro?.fotoUrl ? (
          <Image
            src={membro.fotoUrl}
            alt={user.name}
            width={80}
            height={80}
            className="size-20 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-blue text-2xl font-bold text-white shadow-lg">
            {iniciais(user.name)}
          </div>
        )}
        <h1 className="mt-4 text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="mt-2">
          <RoleBadge role={user.role} />
        </div>
        <Link
          href="/membro/perfil/editar"
          className="mt-4 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium hover:bg-secondary"
        >
          Editar perfil
        </Link>
      </section>

      {membro && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Vínculo Maranata
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Linha rotulo="Igreja" valor={membro.igreja.nome} />
            {membro.participacoes[0] && (
              <Linha rotulo="Célula" valor={membro.participacoes[0].celula.nome} />
            )}
            {membro.telefone && <Linha rotulo="Telefone" valor={membro.telefone} />}
            {membro.profissao && <Linha rotulo="Profissão" valor={membro.profissao} />}
            {membro.dataBatismo && (
              <Linha rotulo="Batismo" valor={dataPtBR(membro.dataBatismo)} />
            )}
            {membro.dataConversao && (
              <Linha rotulo="Conversão" valor={dataPtBR(membro.dataConversao)} />
            )}
            {membro.dataNascimento && (
              <Linha rotulo="Nascimento" valor={dataPtBR(membro.dataNascimento)} />
            )}
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Atalhos
        </h2>
        <div className="mt-3 space-y-1">
          <Atalho href="/membro/carteirinha" label="Carteirinha digital" />
          <Atalho href="/membro/historico" label="Meu histórico" />
          <Atalho href="/membro/oracao" label="Meus pedidos de oração" />
          <Atalho href="/membro/celula" label="Minha célula" />
          <Atalho href="/membro/testemunhos" label="Compartilhar testemunho" />
        </div>
      </section>

      <SairButton />
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}

function Atalho({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-secondary/50"
    >
      <span>{label}</span>
      <span className="text-muted-foreground">→</span>
    </Link>
  );
}
