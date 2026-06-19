import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// 智谱 GLM 的 OpenAI 兼容接口（/api/paas/v4）；用户 token 在该端点同样有效（实测通过）
const zhipu = createOpenAI({
  baseURL: process.env.ZHIPU_BASE_URL ?? "https://open.bigmodel.cn/api/paas/v4",
  apiKey: process.env.ZHIPU_API_KEY ?? "",
  name: "zhipu",
});

export const MODEL_ID = process.env.ZHIPU_MODEL ?? "glm-4.5";

/** 构建 AI 生成模式的 Prompt（要求按「超声医学科报告单」纯文本格式输出） */
export function buildPrompt(parts: string[], inputText: string) {
  const today = new Date().toISOString().slice(0, 10);
  const system =
    "你是一名经验丰富的超声科医生，请根据超声检查口述生成规范的超声检查报告。" +
    "严格按以下【纯文本】格式输出，不要使用 Markdown 的 # 标题符号或 -、* 列表符号：\n\n" +
    "超声检查中心\n超声医学科报告单\n\n" +
    "送检日期: <日期>\n检查部位: <部位>\n图像等级: 乙\n图像记录方式: 软件\n\n" +
    "超声检查结果\n超声描述:\n【器官名】该器官的超声表现……（每个检查器官单独一段，用【】标注器官名）\n\n" +
    "超声提示:\n<结论性意见>\n\n" +
    "检查医生: （待签名）\n报告日期: <日期>";
  const user =
    `检查部位：${parts.join("、") || "未指定"}\n` +
    `送检日期：${today}\n` +
    `口述内容：${inputText.trim()}`;
  return { system, user };
}

/** 流式生成报告，返回 AI SDK 的 streamText 结果 */
export function streamReport(parts: string[], inputText: string) {
  const { system, user } = buildPrompt(parts, inputText);
  return streamText({
    model: zhipu.chat(MODEL_ID),
    system,
    messages: [{ role: "user", content: user }],
  });
}
