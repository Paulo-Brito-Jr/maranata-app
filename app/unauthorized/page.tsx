import Link from "next/link";

export const metadata = { title: "Sem permissão" };

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Sem permissão</h1>
      <p className="mt-3 text-muted-foreground">
        Sua conta não tem acesso a esta área. Se você acha que isso é um engano,
        fale com a administração da igreja.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary px-6 py-3 text-primary-foreground"
      >
        Voltar pra Home
      </Link>
    </main>
  );
}
