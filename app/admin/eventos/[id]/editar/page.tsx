import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { atualizarEvento, deletarEvento } from "../../actions";

export const metadata = { title: "Editar evento" };
export const dynamic = "force-dynamic";

function toLocalDateTime(d: Date | null): string {
  if (!d) return "";
  // YYYY-MM-DDTHH:mm for datetime-local input
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [evento, igrejas, categorias, locais] = await Promise.all([
    prisma.evento.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, ehSede: true, tipo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    }),
    prisma.categoriaEvento.findMany({ orderBy: { nome: "asc" } }),
    prisma.localEvento.findMany({
      where: { ativo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
      select: { id: true, nome: true, tipo: true },
    }),
  ]);

  if (!evento) notFound();

  const atualizarComId = atualizarEvento.bind(null, id);
  const deletarComId = deletarEvento.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link
            href={`/admin/eventos/${id}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Voltar
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar evento</h1>
        </div>
        <form action={deletarComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
            title="Apagar evento e todas as inscrições"
          >
            Excluir evento
          </button>
        </form>
      </header>

      <form
        action={atualizarComId}
        className="space-y-5 rounded-2xl border border-border bg-card p-6"
      >
        <Field label="Título" required>
          <Input name="titulo" required defaultValue={evento.titulo} />
        </Field>
        <Field label="Slug (URL)" hint="só letras minúsculas, números e hífen" required>
          <Input name="slug" required defaultValue={evento.slug} />
        </Field>
        <Field label="Descrição">
          <Textarea name="descricao" rows={3} defaultValue={evento.descricao ?? ""} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Igreja organizadora" required>
            <Select name="igrejaId" required defaultValue={evento.igrejaId}>
              <option value="">Selecione...</option>
              <optgroup label="Sede (eventos gerais)">
                {igrejas.filter((i) => i.tipo === "SEDE").map((i) => (
                  <option key={i.id} value={i.id}>🏛️ {i.nome}</option>
                ))}
              </optgroup>
              <optgroup label="Congregações (eventos locais)">
                {igrejas.filter((i) => i.tipo === "CONGREGACAO").map((i) => (
                  <option key={i.id} value={i.id}>⛪ {i.nome}</option>
                ))}
              </optgroup>
              <optgroup label="Acampamento">
                {igrejas.filter((i) => i.tipo === "ACAMPAMENTO").map((i) => (
                  <option key={i.id} value={i.id}>🏕️ {i.nome}</option>
                ))}
              </optgroup>
            </Select>
          </Field>
          <Field label="Categoria">
            <Select name="categoriaId" defaultValue={evento.categoriaId ?? ""}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Local físico do evento">
          <Select name="localEventoId" defaultValue={evento.localEventoId ?? ""}>
            <option value="">— Texto livre (campo Local/Endereço abaixo) —</option>
            <optgroup label="Acampamento">
              {locais.filter((l) => l.tipo === "ACAMPAMENTO").map((l) => (
                <option key={l.id} value={l.id}>📍 {l.nome}</option>
              ))}
            </optgroup>
            <optgroup label="Unidades IME Maranata">
              {locais.filter((l) => l.tipo === "IGREJA").map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Início" required>
            <Input
              type="datetime-local"
              name="inicio"
              required
              defaultValue={toLocalDateTime(evento.inicio)}
            />
          </Field>
          <Field label="Fim">
            <Input
              type="datetime-local"
              name="fim"
              defaultValue={toLocalDateTime(evento.fim)}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Local">
            <Input name="local" defaultValue={evento.local ?? ""} />
          </Field>
          <Field label="Endereço">
            <Input name="endereco" defaultValue={evento.endereco ?? ""} />
          </Field>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="ehGeral" defaultChecked={evento.ehGeral} />
            <span>
              <strong>Evento geral</strong> — organizado pela Sede e exibido pra
              membros das 14 unidades.
            </span>
          </label>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publicado" defaultChecked={evento.publicado} />{" "}
            Publicado
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="inscricoesAbertas"
              defaultChecked={evento.inscricoesAbertas}
            />{" "}
            Inscrições abertas
          </label>
        </div>
        <Button type="submit">Salvar alterações</Button>
      </form>
    </div>
  );
}
