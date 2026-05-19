import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true, nome: true, igreja: { select: { nome: true } } },
  });
  if (!membro) return new Response("Sem cadastro", { status: 403 });

  const jornada = await prisma.pessoaJornada.findUnique({
    where: { trilhaId_membroId: { trilhaId: id, membroId: membro.id } },
    include: { trilha: { select: { titulo: true } } },
  });

  if (!jornada || jornada.status !== "CONCLUIDA" || !jornada.concluidaEm) {
    return new Response("Trilha ainda não concluída", { status: 400 });
  }

  const dataFmt = jornada.concluidaEm.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "96px",
          background:
            "linear-gradient(135deg, #1a1238 0%, #2d1b4e 60%, #ea580c 100%)",
          color: "white",
          fontFamily: "serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, opacity: 0.7 }}>
          CERTIFICADO DE CONCLUSÃO
        </div>
        <div style={{ marginTop: 40, fontSize: 28, opacity: 0.85 }}>
          A IME Maranata · {membro.igreja?.nome ?? "Suite Maranata"} certifica que
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 80,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          {membro.nome}
        </div>
        <div style={{ marginTop: 32, fontSize: 28, opacity: 0.85 }}>
          concluiu com êxito a trilha de discipulado
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 48,
            fontStyle: "italic",
            opacity: 0.95,
          }}
        >
          «{jornada.trilha.titulo}»
        </div>
        <div
          style={{
            marginTop: 64,
            display: "flex",
            gap: 80,
            fontSize: 20,
            opacity: 0.75,
          }}
        >
          <span>Concluído em {dataFmt}</span>
          <span>maranata.app</span>
        </div>
      </div>
    ),
    { width: 1600, height: 1131 }, // proporção A4 paisagem
  );
}
