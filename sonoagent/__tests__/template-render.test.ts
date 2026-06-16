import { describe, it, expect } from "vitest";
import { renderTemplate } from "../lib/template-render";

describe("renderTemplate", () => {
  it("输出报告单抬头与基本信息", () => {
    const out = renderTemplate(["肝脏"], "肝脏正常");
    expect(out).toContain("超声医学科报告单");
    expect(out).toContain("检查部位: 肝脏");
    expect(out).toContain("送检日期:");
    expect(out).toContain("图像等级: 乙");
  });

  it("多个部位时每个器官一段【】", () => {
    const out = renderTemplate(["肝脏", "胆囊"], "x");
    expect(out).toContain("【肝脏】");
    expect(out).toContain("【胆囊】");
  });

  it("未命中模板的部位用口述文本", () => {
    const out = renderTemplate(["未知部位" as any], "口述内容ABC");
    expect(out).toContain("【未知部位】");
    expect(out).toContain("口述内容ABC");
  });

  it("纯文本无 Markdown 符号", () => {
    const out = renderTemplate(["肝脏"], "x");
    expect(out).not.toContain("#");
  });
});
