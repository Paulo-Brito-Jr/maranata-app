import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brl, dataPtBR } from "@/lib/utils";

export const metadata = { title: "Membro" };

export default async function MembroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const membro = await prisma.membro.findUnique({
    where: { id },
    include: {
      igreja: { select: { nome: true } },
      participacoes: { include: { celula: { select: { nome: true } } } },
      doacoesFeitas: { orderBy: { criadaEm: "desc" }, take: 10 },
    },
  });

  if (!membro) notFound();

  const totalDoado = membro.doacoesFeitas
    .filter((d) => d.status === "PAGA")
    .reduce((sum, d) => sum + Number(d.valor), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/membros" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{membro.nome}</h1>
            <p className="text-muted-foreground">{membro.igreja.nome}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/membros/${id}/editar`}
              className="rounded-full border border-border bg-card px-5 py-2 text-sm hover:bg-secondary"
            >
              Editar
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card titulo="Dados pessoais">
          <Row label="E-mail" valor={membro.email} />
          <Row label="Telefone" valor={membro.telefone} />
          <Row label="CPF" valor={membro.cpf} />
          <Row label="Profissão" valor={membro.profissao} />
          <Row label="Estado civil" valor={membro.estadoCivil} />
          <Row label="Nascimento" valor={dataPtBR(membro.dataNascimento)} />
        </Card>
        <Card titulo="Espiritual">
          <Row label="Conversão" valor={dataPtBR(membro.dataConversao)} />
          <Row label="Batismo" valor={dataPtBR(membro.dataBatismo)} />
          <Row label="Status" valor={membro.status} />
        </Card>
        <Card titulo="Endereço">
          <Row label="Endereço" valor={membro.endereco} />
          <Row label="Cidade" valor={membro.cidade} />
        </Card>
        <Card titulo="Participação">
          <Row
            label="Células"
            valor={
              membro.participacoes.length > 0
                ? membro.participacoes.map((p) => p.celula.nome).join(", ")
                : "—"
            }
          />
          <Row label="Total doado" valor={brl(totalDoado)} />
        </Card>
      </section>

      {membro.observacoes && (
        <Card titulo="Observações">
          <p className="text-sm">{membro.observacoes}</p>
        </Card>
      )}
    </div>
  );
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
        {titulo}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, valor }: { label: string; valor: string | number | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{valor || "—"}</span>
    </div>
  );
}
