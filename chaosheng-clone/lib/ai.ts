import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// 智谱 GLM 提供 OpenAI 兼容接口，用 createOpenAI 指向智谱 baseURL（AI SDK 官方自定义 provider 方式）
const zhipu = createOpenAI({
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  apiKey: process.env.ZHIPU_API_KEY ?? "",
  name: "zhipu",
});

export const MODEL_ID = process.env.ZHIPU_MODEL ?? "glm-4-plus";

/** 构建 AI 生成模式的 Prompt */
export function buildPrompt(parts: string[], inputText: string) {
  const system =
    "你是一名经验丰富的超声科医生，擅长根据超声检查口述生成规范、结构化的超声检查报告。" +
    "只输出报告内容，使用 Markdown 格式，包含：检查信息、超声所见、超声提示、建议四个部分。";
  const user =
    `请依据以下超声检查口述，生成结构化报告。\n` +
    `检查部位：${parts.join("、") || "未指定"}\n` +
    `口述内容：${inputText.trim()}`;
  return { system, user };
}

/** 流式生成报告，返回 AI SDK 的 streamText 结果 */
export function streamReport(parts: string[], inputText: string) {
  const { system, user } = buildPrompt(parts, inputText);
  return streamText({
    model: zhipu(MODEL_ID),
    system,
    messages: [{ role: "user", content: user }],
  });
}
