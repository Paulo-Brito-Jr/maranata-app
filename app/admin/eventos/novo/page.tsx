import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarEvento } from "../actions";

export const metadata = { title: "Novo evento" };

export default async function NovoEventoPage() {
  const [igrejas, categorias, locais] = await Promise.all([
    prisma.igreja.findMany({
      select: { id: true, nome: true, ehSede: true },
      orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
    }),
    prisma.categoriaEvento.findMany({ orderBy: { nome: "asc" } }),
    prisma.localEvento.findMany({
      where: { ativo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
      select: { id: true, nome: true, tipo: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/admin/eventos" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Novo evento</h1>
      </header>

      <form action={criarEvento} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="Título" required>
          <Input name="titulo" required />
        </Field>
        <Field label="Slug (URL)" hint="só letras minúsculas, números e hífen" required>
          <Input name="slug" required />
        </Field>
        <Field label="Descrição">
          <Textarea name="descricao" rows={3} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Igreja organizadora" required hint="Quem cuida/promove o evento">
            <Select name="igrejaId" required>
              <option value="">Selecione...</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}{i.ehSede ? " (Sede)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoria">
            <Select name="categoriaId" defaultValue="">
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Local físico do evento"
          hint="Acontece em uma das 15 unidades, no Acampamento Maranata ou em outro local cadastrado. Deixe em branco pra usar o endereço livre abaixo."
        >
          <Select name="localEventoId" defaultValue="">
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
            {locais.some((l) => l.tipo === "EXTERNO") && (
              <optgroup label="Locais externos">
                {locais.filter((l) => l.tipo === "EXTERNO").map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Início" required>
            <Input type="datetime-local" name="inicio" required />
          </Field>
          <Field label="Fim">
            <Input type="datetime-local" name="fim" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Local">
            <Input name="local" placeholder="Sede - Auditório principal" />
          </Field>
          <Field label="Endereço">
            <Input name="endereco" />
          </Field>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="ehGeral" className="mt-0.5" />
            <span>
              <strong>Evento geral</strong> — organizado pela Sede e exibido pra
              membros das 15 unidades. Marque pra eventos como acampamentos,
              congressos e festas-amor que envolvem todo o campo.
            </span>
          </label>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publicado" defaultChecked /> Publicar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="inscricoesAbertas" /> Abrir inscrições
          </label>
        </div>
        <Button type="submit">Criar evento</Button>
      </form>
    </div>
  );
}
