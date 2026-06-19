import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = await getDb();
  return Response.json({ reports: await db.listReports() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();
  const id = await db.createReport({
    mode: body.mode,
    exam_parts: body.exam_parts ?? [],
    input_text: body.input_text ?? "",
    report_content: body.report_content ?? "",
    model: body.model ?? "unknown",
    output_mode: body.output_mode ?? "stream",
  });
  return Response.json({ id });
}
