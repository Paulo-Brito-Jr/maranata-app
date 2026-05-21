import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Button } from "@/components/ui/field";
import {
  adicionarSlotAction,
  removerSlotAction,
  toggleSlotAtivoAction,
  removerIntercessorAction,
} from "./actions";

export const metadata = { title: "Escala de Intercessão" };
export const dynamic = "force-dynamic";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type SearchParams = {
  intercessor?: string;
};

export default async function EscalaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const intercessorSelecionado = params.intercessor ?? "";

  const slots = await prisma.escalaIntercessao.findMany({
    orderBy: [{ diaSemana: "asc" }, { hora: "asc" }],
  });

  // Lista de intercessores distintos
  const intercessorIds = Array.from(
    new Set(slots.map((s) => s.intercessorId).filter(Boolean)),
  );
  const membrosNaEscala = intercessorIds.length
    ? await prisma.membro.findMany({
        where: { id: { in: intercessorIds } },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      })
    : [];

  // Resto de membros — pra autocomplete simples no select (limitado)
  const membrosCandidatos = await prisma.membro.findMany({
    where: { status: "ATIVO" },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
    take: 500,
  });

  const mapaMembros = new Map(
    [...membrosCandidatos, ...membrosNaEscala].map((m) => [m.id, m.nome]),
  );

  // Grid 7×24: para o intercessor selecionado, marca slots ativos
  const slotsDoSelecionado = intercessorSelecionado
    ? slots.filter((s) => s.intercessorId === intercessorSelecionado)
    : [];
  const ativoMatrix = new Map<string, (typeof slots)[number]>();
  for (const s of slotsDoSelecionado) {
    ativoMatrix.set(`${s.diaSemana}-${s.hora}`, s);
  }

  // Coloridos cruzados — heatmap "quantos intercessores cobrem cada slot"
  const coberturaMap = new Map<string, number>();
  for (const s of slots.filter((s) => s.ativo)) {
    const k = `${s.diaSemana}-${s.hora}`;
    coberturaMap.set(k, (coberturaMap.get(k) ?? 0) + 1);
  }

  const totalSlots = slots.length;
  const totalAtivos = slots.filter((s) => s.ativo).length;
  const coberturaMedia =
    coberturaMap.size > 0
      ? Number(
          (
            [...coberturaMap.values()].reduce((a, b) => a + b, 0) /
            coberturaMap.size
          ).toFixed(2),
        )
      : 0;

  return (
    <ModuloShell
      titulo="Escala de Intercessão 7×24"
      descricao="Cadastre intercessores em horários da semana. O round-robin distribui pedidos abertos entre quem está na escala ativa."
      acoes={[{ href: "/admin/intercessao", label: "← Voltar" }]}
      stats={[
        { label: "Intercessores", valor: membrosNaEscala.length },
        { label: "Slots cadastrados", valor: totalSlots },
        { label: "Slots ativos", valor: totalAtivos },
        { label: "Cobertura média/slot", valor: coberturaMedia },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Adicionar slot
        </h2>
        <form
          action={adicionarSlotAction}
          className="flex flex-wrap items-end gap-3"
        >
          <Field label="Intercessor" required className="min-w-[16rem] flex-1">
            <select
              name="intercessorId"
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              defaultValue={intercessorSelecionado || ""}
            >
              <option value="">Escolher membro…</option>
              {membrosCandidatos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dia" required>
            <select
              name="diaSemana"
              required
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              {DIAS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hora (0-23)" required>
            <Input
              name="hora"
              type="number"
              min={0}
              max={23}
              defaultValue={8}
              required
              className="w-24"
            />
          </Field>
          <Button type="submit">Adicionar</Button>
        </form>
      </section>

      {membrosNaEscala.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Intercessores cadastrados
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/intercessao/escala"
              className={`rounded-full border px-3 py-1.5 text-xs ${
                !intercessorSelecionado
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Cobertura geral
            </Link>
            {membrosNaEscala.map((m) => {
              const slotsDele = slots.filter((s) => s.intercessorId === m.id);
              const ativos = slotsDele.filter((s) => s.ativo).length;
              const ativo = intercessorSelecionado === m.id;
              return (
                <Link
                  key={m.id}
                  href={`/admin/intercessao/escala?intercessor=${m.id}`}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    ativo
                      ? "border-primary/40 bg-primary/15 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.nome} · {ativos}/{slotsDele.length}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Grid 7×24{" "}
            {intercessorSelecionado &&
              mapaMembros.get(intercessorSelecionado) && (
                <span className="ml-2 normal-case tracking-normal text-foreground">
                  · {mapaMembros.get(intercessorSelecionado)}
                </span>
              )}
          </h2>
          <p className="text-xs text-muted-foreground">
            {intercessorSelecionado
              ? "Verde = intercessor cobre / Cinza = sem cobertura"
              : "Tom verde = nº de intercessores cobrindo (heatmap)"}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-3">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="w-12 p-1 text-left text-muted-foreground">
                  Hora
                </th>
                {DIAS.map((d) => (
                  <th
                    key={d}
                    className="p-1 font-medium text-muted-foreground"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, h) => (
                <tr key={h}>
                  <td className="p-1 text-left text-muted-foreground">
                    {String(h).padStart(2, "0")}h
                  </td>
                  {DIAS.map((_, dia) => {
                    const key = `${dia}-${h}`;
                    const slotEsp = ativoMatrix.get(key);
                    const cobertura = coberturaMap.get(key) ?? 0;

                    if (intercessorSelecionado) {
                      const ativo = slotEsp?.ativo ?? false;
                      return (
                        <td
                          key={key}
                          className={`p-1 ${
                            ativo
                              ? "bg-emerald-500/30 text-emerald-50"
                              : "bg-secondary/20 text-muted-foreground/40"
                          }`}
                          title={
                            ativo
                              ? "Clique pra desativar"
                              : "Adicione via formulário"
                          }
                        >
                          {slotEsp ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{ativo ? "✓" : "·"}</span>
                              <form
                                action={toggleSlotAtivoAction.bind(
                                  null,
                                  slotEsp.id,
                                  !ativo,
                                )}
                              >
                                <button
                                  className="rounded-full bg-background/50 px-1.5 py-0.5 text-[10px] hover:bg-background"
                                  title={ativo ? "Desativar" : "Ativar"}
                                >
                                  {ativo ? "off" : "on"}
                                </button>
                              </form>
                              <form
                                action={removerSlotAction.bind(
                                  null,
                                  slotEsp.id,
                                )}
                              >
                                <button
                                  className="text-[10px] text-destructive/80 hover:text-destructive"
                                  title="Remover"
                                >
                                  ✕
                                </button>
                              </form>
                            </div>
                          ) : (
                            "·"
                          )}
                        </td>
                      );
                    }

                    // Heatmap geral
                    const cor =
                      cobertura === 0
                        ? "bg-secondary/20 text-muted-foreground/40"
                        : cobertura === 1
                          ? "bg-emerald-500/15 text-emerald-200"
                          : cobertura === 2
                            ? "bg-emerald-500/30 text-emerald-50"
                            : "bg-emerald-500/50 text-emerald-50";
                    return (
                      <td key={key} className={`p-1 ${cor}`}>
                        {cobertura > 0 ? cobertura : "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {intercessorSelecionado && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <h3 className="text-sm font-medium">
            Remover todos os slots de{" "}
            {mapaMembros.get(intercessorSelecionado) ?? "(membro)"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Apaga TODOS os slots deste intercessor da escala (irreversível).
          </p>
          <form
            action={removerIntercessorAction.bind(
              null,
              intercessorSelecionado,
            )}
            className="mt-3"
          >
            <button className="rounded-full bg-destructive/15 px-4 py-1.5 text-xs text-destructive hover:bg-destructive/25">
              Remover intercessor da escala
            </button>
          </form>
        </section>
      )}
    </ModuloShell>
  );
}
