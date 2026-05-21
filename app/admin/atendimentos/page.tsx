import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { dataPtBR } from "@/lib/utils";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarAtendimentoAction,
  excluirAtendimentoAction,
} from "./actions";

export const metadata = { title: "Atendimentos pastorais" };
export const dynamic = "force-dynamic";

const TIPOS = [
  { value: "visita", label: "Visita" },
  { value: "ligacao", label: "Ligação" },
  { value: "oracao", label: "Oração" },
  { value: "aconselhamento", label: "Aconselhamento" },
  { value: "outro", label: "Outro" },
];

export default async function AtendimentosPage() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  // AtendimentoPastoral filtra via membro.igrejaId
  const atendIgreja = filtroIgreja.igrejaId
    ? { membro: { igrejaId: filtroIgreja.igrejaId } }
    : {};

  const [atendimentos, total, membros, pastores] = await Promise.all([
    prisma.atendimentoPastoral.findMany({
      where: atendIgreja,
      orderBy: { realizadoEm: "desc" },
      take: 50,
      include: {
        membro: { select: { id: true, nome: true } },
        pastor: { select: { id: true, nome: true } },
      },
    }),
    prisma.atendimentoPastoral.count({ where: atendIgreja }),
    prisma.membro.findMany({
      where: filtroIgreja,
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
      take: 500,
    }),
    prisma.usuario.findMany({
      where: {
        papel: { in: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"] },
        ativo: true,
      },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Atendimentos pastorais"
      descricao="Registro de visitas, ligações, orações e aconselhamentos feitos pelos pastores."
      stats={[
        { label: "Total registrados", valor: total },
        { label: "Mostrados", valor: atendimentos.length, ref: "Últimos 50" },
        { label: "Pastores ativos", valor: pastores.length },
      ]}
    >
      <details className="rounded-2xl border border-border bg-card p-5" open>
        <summary className="cursor-pointer text-sm font-semibold">
          Registrar novo atendimento
        </summary>
        <form action={criarAtendimentoAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Membro" required>
            <Select name="membroId" required defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pastor responsável" required>
            <Select name="pastorId" required defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {pastores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo" required>
            <Select name="tipo" required defaultValue="visita">
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data/hora">
            <Input type="datetime-local" name="realizadoEm" />
          </Field>
          <Field label="Resumo" required className="md:col-span-2">
            <Input
              name="resumo"
              placeholder="Resumo curto do atendimento"
              required
            />
          </Field>
          <Field label="Detalhes" className="md:col-span-2">
            <Textarea
              name="detalhes"
              rows={3}
              placeholder="Notas detalhadas (opcional)"
            />
          </Field>
          <Field label="Próxima ação" className="md:col-span-2">
            <Input
              name="proximaAcao"
              placeholder="Ex: ligar daqui 2 semanas"
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Registrar atendimento</Button>
          </div>
        </form>
      </details>

      {atendimentos.length === 0 ? (
        <EmptyState
          titulo="Nenhum atendimento pastoral registrado"
          descricao="Use o formulário acima pra começar."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Membro</th>
                <th className="px-4 py-3 font-medium">Pastor</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Resumo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {atendimentos.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {dataPtBR(a.realizadoEm)}
                  </td>
                  <td className="px-4 py-3 font-medium">{a.membro.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.pastor.nome}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {a.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.resumo}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={excluirAtendimentoAction.bind(null, a.id)}>
                      <button
                        type="submit"
                        className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"
                      >
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModuloShell>
  );
}
