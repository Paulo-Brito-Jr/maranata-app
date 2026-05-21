import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarEvento } from "../actions";
import { EhGeralAutoSugere } from "./eh-geral-auto-sugere";

export const metadata = { title: "Novo evento" };

export default async function NovoEventoPage() {
  const [igrejas, categorias, locais] = await Promise.all([
    // Organizadora: aceita Sede (eventos gerais), 14 Congregações (eventos
    // locais) e Acampamento (retiros/acampamentos próprios do sítio).
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
          <Field label="Igreja organizadora" required hint="Quem cuida/promove o evento — Sede organiza eventos gerais, congregações organizam locais, Acampamento organiza retiros próprios.">
            <Select name="igrejaId" required>
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
              <optgroup label="Acampamento (retiros / acampamentos próprios)">
                {igrejas.filter((i) => i.tipo === "ACAMPAMENTO").map((i) => (
                  <option key={i.id} value={i.id}>🏕️ {i.nome}</option>
                ))}
              </optgroup>
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
          hint="Acontece em uma das 14 unidades, no Acampamento Maranata ou em outro local cadastrado. Deixe em branco pra usar o endereço livre abaixo."
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
        <EhGeralAutoSugere
          sedeId={igrejas.find((i) => i.tipo === "SEDE")?.id ?? null}
        />
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
