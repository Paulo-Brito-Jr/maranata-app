import Link from "next/link";

export const metadata = { title: "Obrigado" };

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <div className="mx-auto size-16 rounded-full bg-success/20 text-4xl leading-[64px]">🙏</div>
      <h1 className="mt-4 text-3xl font-bold">Obrigado, família!</h1>
      <p className="mt-2 text-muted-foreground">
        Sua intenção de contribuir foi registrada. Em breve você receberá o link de pagamento Safe2Pay no e-mail.
      </p>
      {ref && (
        <p className="mt-3 text-xs text-muted-foreground">
          Ref: <code className="rounded bg-muted px-1.5 py-0.5">{ref}</code>
        </p>
      )}
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground"
      >
        Voltar pro início
      </Link>
    </div>
  );
}
