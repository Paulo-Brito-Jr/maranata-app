import Link from "next/link";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { criarDevocional } from "./actions";

export const metadata = { title: "Novo devocional" };

function dataPadrao(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function NovoDevocional() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <Link
          href="/admin/devocional"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Devocional
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Novo devocional</h1>
        <p className="text-sm text-muted-foreground">
          Aparece em /membro/devocional na data escolhida.
        </p>
      </header>

      <form action={criarDevocional} className="space-y-4">
        <Field label="Data" required>
          <Input type="date" name="data" defaultValue={dataPadrao()} required />
        </Field>

        <Field label="Título" required>
          <Input name="titulo" required maxLength={120} placeholder="Ex.: A graça basta" />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Referência" required hint='Ex.: "Sl 23.1" ou "2Co 12.9"'>
            <Input name="versiculoRef" required maxLength={40} />
          </Field>
          <Field label="Autor" hint="Quem escreveu a reflexão.">
            <Input name="autor" maxLength={120} />
          </Field>
        </div>

        <Field label="Texto do versículo" required>
          <Textarea name="versiculoTexto" required rows={3} />
        </Field>

        <Field label="Reflexão" required hint="Markdown leve aceito.">
          <Textarea name="texto" required rows={10} />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="publicado" defaultChecked /> Publicar imediatamente
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Publicar</Button>
          <Link
            href="/admin/devocional"
            className="rounded-full border border-border bg-card px-5 py-2 text-sm hover:bg-secondary"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
