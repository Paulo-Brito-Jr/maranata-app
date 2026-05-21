import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarPregacao } from "../actions";

export const metadata = { title: "Nova pregação" };

export default async function NovaPregacaoPage() {
  const [categorias, igrejas] = await Promise.all([
    prisma.categoriaPregacao.findMany({ orderBy: { nome: "asc" } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, apelido: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/admin/pregacoes" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Nova pregação</h1>
      </header>
      <form action={criarPregacao} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="Título" required>
          <Input name="titulo" required />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pregador">
            <Input name="pregador" />
          </Field>
          <Field label="Data">
            <Input type="date" name="data" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="YouTube ID" hint="só o ID, ex: dQw4w9WgXcQ">
            <Input name="youtubeId" />
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
        <Field label="Descrição">
          <Textarea name="descricao" rows={3} />
        </Field>
        <Field
          label="Escopo"
          hint="Geral = aparece pra todas as 14 unidades. Local = só pra membros daquela unidade."
        >
          <Select name="igrejaId" defaultValue="GERAL">
            <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                📍 Local — {ig.apelido ?? ig.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Criar pregação</Button>
      </form>
    </div>
  );
}
