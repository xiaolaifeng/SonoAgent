import { REPORT_TEMPLATES } from "./templates";

const GENERIC_TEMPLATE = `# 超声检查报告

## 检查部位：{part}

## 超声所见
{content}

## 超声提示
请结合临床进一步评估。

## 建议
必要时复查。`;

/** 模板匹配模式：按选中部位拼接模板，填入口述文本。纯函数，不调 LLM。 */
export function renderTemplate(parts: string[], inputText: string): string {
  const blocks = parts.map(part => {
    const tpl = REPORT_TEMPLATES[part] ?? GENERIC_TEMPLATE.replace("{part}", part);
    return tpl.replace("{content}", inputText.trim() || "（未提供口述内容）");
  });
  return blocks.join("\n\n---\n\n");
}
