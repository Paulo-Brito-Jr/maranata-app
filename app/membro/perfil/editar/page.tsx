import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { atualizarMeuPerfil } from "./actions";

export const metadata = { title: "Editar perfil" };
export const dynamic = "force-dynamic";

export default async function EditarPerfil() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/perfil/editar");

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });

  if (!membro) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Editar perfil</h1>
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Não encontramos um cadastro de membro associado ao seu e-mail{" "}
          <strong>{user.email}</strong>. Procure a secretaria pra vincular sua conta.
        </div>
        <Link
          href="/membro/perfil"
          className="inline-block rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <Link
          href="/membro/perfil"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Voltar pro perfil
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar perfil</h1>
        <p className="text-sm text-muted-foreground">
          Atualize seus dados de contato. Para mudanças em batismo, status ou vínculo
          familiar, fale com a secretaria.
        </p>
      </header>

      <form action={atualizarMeuPerfil} className="space-y-5">
        <Field label="Foto (URL)" hint="Cole o link de uma imagem sua. Em breve: upload direto.">
          <Input
            type="url"
            name="fotoUrl"
            defaultValue={membro.fotoUrl ?? ""}
            placeholder="https://…"
          />
        </Field>

        <Field label="Telefone / WhatsApp">
          <Input
            type="tel"
            name="telefone"
            defaultValue={membro.telefone ?? ""}
            placeholder="(21) 99999-9999"
          />
        </Field>

        <Field label="Profissão">
          <Input name="profissao" defaultValue={membro.profissao ?? ""} />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Endereço" className="md:col-span-2">
            <Input name="endereco" defaultValue={membro.endereco ?? ""} />
          </Field>
          <Field label="Cidade">
            <Input name="cidade" defaultValue={membro.cidade ?? ""} />
          </Field>
          <Field label="Estado">
            <Input name="estado" defaultValue={membro.estado ?? ""} maxLength={40} />
          </Field>
          <Field label="CEP">
            <Input name="cep" defaultValue={membro.cep ?? ""} placeholder="00000-000" />
          </Field>
        </div>

        <Field label="Observações" hint="Algo que a igreja precisa saber sobre você.">
          <Textarea name="observacoes" rows={4} defaultValue={membro.observacoes ?? ""} />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Salvar alterações</Button>
          <Link
            href="/membro/perfil"
            className="rounded-full border border-border bg-card px-5 py-2 text-sm hover:bg-secondary"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
