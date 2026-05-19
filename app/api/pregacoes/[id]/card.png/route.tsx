import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const p = await prisma.pregacao.findUnique({
    where: { id },
    select: { titulo: true, pregador: true, data: true, igreja: { select: { nome: true } } },
  });

  if (!p) {
    return new Response("Pregação não encontrada", { status: 404 });
  }

  const dataFmt = p.data
    ? p.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #1a1238 0%, #2d1b4e 50%, #ea580c 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #ea580c 0%, #3b82f6 100%)",
            }}
          />
          <span style={{ fontSize: 22, fontWeight: 600, opacity: 0.85 }}>
            IME Maranata · {p.igreja?.nome ?? "Pregações"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 18, letterSpacing: 4, opacity: 0.7, textTransform: "uppercase" }}>
            Pregação
          </span>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{p.titulo}</span>
          {p.pregador && (
            <span style={{ fontSize: 28, opacity: 0.85 }}>{p.pregador}</span>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: 18, opacity: 0.7 }}>{dataFmt}</span>
          <span style={{ fontSize: 18, opacity: 0.7 }}>maranata.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 1200 },
  );
}
