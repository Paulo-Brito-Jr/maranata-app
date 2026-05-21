import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { atualizarBannerAction, deletarBannerAction } from "../../actions";

export const metadata = { title: "Editar banner" };
export const dynamic = "force-dynamic";

function ymd(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function EditarBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [banner, igrejas] = await Promise.all([
    prisma.banner.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!banner) notFound();

  const atualizarComId = atualizarBannerAction.bind(null, id);
  const excluirComId = deletarBannerAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/banners" className="text-sm text-muted-foreground hover:text-primary">
            ← Banners
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar banner</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
          >
            Excluir
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-3 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Título" required>
          <Input name="titulo" required defaultValue={banner.titulo} />
        </Field>
        <Field label="Subtítulo">
          <Input name="subtitulo" defaultValue={banner.subtitulo ?? ""} />
        </Field>
        <Field label="Imagem URL">
          <Input name="imagemUrl" type="url" defaultValue={banner.imagemUrl ?? ""} />
        </Field>
        <Field label="Link URL">
          <Input name="linkUrl" type="url" defaultValue={banner.linkUrl ?? ""} />
        </Field>
        <Field label="Ordem">
          <Input name="ordem" type="number" defaultValue={banner.ordem} />
        </Field>
        <Field label="Início">
          <Input name="inicio" type="date" defaultValue={ymd(banner.inicio)} />
        </Field>
        <Field label="Fim">
          <Input name="fim" type="date" defaultValue={ymd(banner.fim)} />
        </Field>
        <Field label="Escopo" className="md:col-span-2">
          <Select name="igrejaId" defaultValue={banner.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                📍 Local — {ig.apelido ?? ig.nome}
              </option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
