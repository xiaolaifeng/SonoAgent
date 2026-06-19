import { REPORT_TEMPLATES } from "./templates";

const HOSPITAL = "超声检查中心";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 模板匹配模式：按选中部位拼装规范「超声医学科报告单」（纯文本，无 Markdown）。不调 LLM。 */
export function renderTemplate(parts: string[], inputText: string): string {
  const t = today();
  const partsLabel = parts.join("、") || "未指定";
  const desc = parts
    .map(p => `【${p}】${REPORT_TEMPLATES[p] ?? (inputText.trim() || "未见明显异常。")}`)
    .join("\n");
  return [
    HOSPITAL,
    "超声医学科报告单",
    "",
    `送检日期: ${t}`,
    `检查部位: ${partsLabel}`,
    "图像等级: 乙",
    "图像记录方式: 软件",
    "",
    "超声检查结果",
    "超声描述:",
    desc,
    "",
    "超声提示:",
    "未见明显异常，建议结合临床综合评估。",
    "",
    "检查医生: （待签名）",
    `报告日期: ${t}`,
  ].join("\n");
}
