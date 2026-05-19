import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { CheckinForm } from "./checkin-form";

export const metadata = { title: "Check-in Kids" };
export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const [criancas, turmas] = await Promise.all([
    prisma.kidsCrianca.findMany({
      where: { ativa: true },
      include: {
        responsaveis: {
          orderBy: [{ principal: "desc" }, { nome: "asc" }],
        },
        igreja: { select: { nome: true, id: true } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.kidsTurma.findMany({
      where: { ativa: true },
      include: { igreja: { select: { nome: true } } },
      orderBy: [{ igreja: { nome: "asc" } }, { faixaEtaria: "asc" }, { nome: "asc" }],
    }),
  ]);

  return (
    <ModuloShell
      titulo="Check-in Kids"
      descricao="Receba a criança, confirme alergias e gere o ticket de retirada (QR único)."
      stats={[]}
      acoes={[{ href: "/admin/kids", label: "← Voltar" }]}
    >
      {criancas.length === 0 || turmas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-sm">
          {criancas.length === 0 && (
            <p>
              Nenhuma criança cadastrada.{" "}
              <Link href="/admin/kids/criancas" className="text-primary underline">
                Cadastre a primeira
              </Link>
              .
            </p>
          )}
          {turmas.length === 0 && (
            <p className="mt-2">
              Nenhuma turma ativa.{" "}
              <Link href="/admin/kids/turmas" className="text-primary underline">
                Crie uma turma
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <CheckinForm criancas={criancas} turmas={turmas} />
      )}
    </ModuloShell>
  );
}
