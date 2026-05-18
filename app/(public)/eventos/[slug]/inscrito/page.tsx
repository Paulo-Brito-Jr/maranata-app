import Link from "next/link";

export const metadata = { title: "Inscrição confirmada" };

export default async function InscritoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <div className="mx-auto size-16 rounded-full bg-success/20 text-4xl leading-[64px]">✓</div>
      <h1 className="mt-4 text-3xl font-bold">Inscrição confirmada!</h1>
      <p className="mt-2 text-muted-foreground">
        Você receberá um e-mail com o QR code de entrada. Guarde a referência:
      </p>
      {ref && (
        <code className="mt-4 inline-block rounded-xl bg-muted px-4 py-2 text-sm">
          {ref}
        </code>
      )}
      <div className="mt-6">
        <Link
          href="/eventos"
          className="rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          Ver mais eventos
        </Link>
      </div>
    </div>
  );
}
