import { NextResponse } from "next/server";
import { criarPushSegmentadoAction } from "@/app/admin/push/actions";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const formData = await req.formData();
  await criarPushSegmentadoAction(formData);
  return NextResponse.redirect(new URL("/admin/push?ok=segmentado", url.origin));
}
