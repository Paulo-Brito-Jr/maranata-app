import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import {
  criarCampoAction,
  toggleCampoAtivoAction,
  excluirCampoAction,
} from "./actions";

export const metadata = { title: "Campos customizados" };
export const dynamic = "force-dynamic";

const TIPOS = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "boolean", label: "Sim/Não" },
  { value: "select", label: "Seleção (lista)" },
];

const ENTIDADES = [
  { value: "Membro", label: "Membro" },
  { value: "Visitante", label: "Visitante" },
  { value: "Evento", label: "Evento" },
];

export default async function CamposCustomizadosPage() {
  const campos = await prisma.campoCustomizado.findMany({
    orderBy: [{ entidade: "asc" }, { ordem: "asc" }, { chave: "asc" }],
  });

  const totalAtivos = campos.filter((c) => c.ativo).length;
  const porEntidade = new Map<string, number>();
  for (const c of campos) {
    porEntidade.set(c.entidade, (porEntidade.get(c.entidade) ?? 0) + 1);
  }

  return (
    <ModuloShell
      titulo="Campos customizados"
      descricao="Extensões de Membro, Visitante e Evento — adicione campos próprios da Maranata sem mexer no schema."
      stats={[
        { label: "Total de campos", valor: campos.length },
        { label: "Ativos", valor: totalAtivos },
        {
          label: "Membro / Visitante / Evento",
          valor: `${porEntidade.get("Membro") ?? 0} / ${porEntidade.get("Visitante") ?? 0} / ${porEntidade.get("Evento") ?? 0}`,
        },
      ]}
    >
      <details className="rounded-2xl border border-border bg-card p-5" open>
        <summary className="cursor-pointer text-sm font-semibold">
          Criar / atualizar campo
        </summary>
        <form action={criarCampoAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field
            label="Chave (snake_case)"
            hint="Identificador único do campo, ex: data_recomendacao"
            required
          >
            <Input name="chave" placeholder="data_recomendacao" required />
          </Field>
          <Field label="Rótulo" required>
            <Input
              name="rotulo"
              placeholder="Data da recomendação"
              required
            />
          </Field>
          <Field label="Tipo" required>
            <Select name="tipo" required defaultValue="text">
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Entidade" required>
            <Select name="entidade" required defaultValue="Membro">
              {ENTIDADES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Opções (se tipo for 'select')"
            hint="Uma por linha ou separadas por vírgula"
            className="md:col-span-2"
          >
            <Textarea
              name="opcoes"
              rows={3}
              placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
            />
          </Field>
          <Field label="Ordem">
            <Input name="ordem" type="number" defaultValue={0} />
          </Field>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="obrigatorio" />
              Obrigatório
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="ativo" defaultChecked />
              Ativo
            </label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Salvar campo</Button>
          </div>
        </form>
      </details>

      {campos.length === 0 ? (
        <EmptyState
          titulo="Nenhum campo customizado"
          descricao="Adicione o primeiro com o formulário acima."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Entidade</th>
                <th className="px-4 py-3 font-medium">Chave</th>
                <th className="px-4 py-3 font-medium">Rótulo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Obrig.</th>
                <th className="px-4 py-3 font-medium">Ordem</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {campos.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.entidade}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.chave}</td>
                  <td className="px-4 py-3">{c.rotulo}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.tipo}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.obrigatorio ? "Sim" : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.ordem}</td>
                  <td className="px-4 py-3">
                    <form
                      action={toggleCampoAtivoAction.bind(null, c.id, !c.ativo)}
                    >
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          c.ativo
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-secondary/60 text-muted-foreground"
                        }`}
                        type="submit"
                      >
                        {c.ativo ? "✓ Ativo" : "Inativo"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={excluirCampoAction.bind(null, c.id)}>
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
