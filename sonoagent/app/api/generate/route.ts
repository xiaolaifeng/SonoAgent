import { NextRequest } from "next/server";
import { streamReport } from "@/lib/ai";
import { renderTemplate } from "@/lib/template-render";

export const runtime = "nodejs"; // better-sqlite3 / 流式需要 Node 运行时

export async function POST(req: NextRequest) {
  const { mode, parts = [], text = "" } = await req.json().catch(() => ({}));

  if (!text?.trim()) {
    return Response.json({ error: "输入文本不能为空" }, { status: 400 });
  }

  // 模板匹配模式：直接拼装返回（非流式）
  if (mode === "template") {
    const content = renderTemplate(parts, text);
    return Response.json({ content });
  }

  // AI 生成模式：纯文本流（AI SDK v6，前端逐字渲染，无需解析协议）
  try {
    const result = streamReport(parts, text);
    return result.toTextStreamResponse();
  } catch (e: any) {
    return Response.json({ error: `生成失败：${e?.message ?? e}` }, { status: 500 });
  }
}
