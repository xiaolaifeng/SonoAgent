import { describe, it, expect } from "vitest";
import { renderTemplate } from "../lib/template-render";

describe("renderTemplate", () => {
  it("单个部位时返回该部位模板并填入口述", () => {
    const out = renderTemplate(["甲状腺"], "双叶甲状腺大小正常");
    expect(out).toContain("检查部位：甲状腺");
    expect(out).toContain("双叶甲状腺大小正常");
  });

  it("多个部位时拼接各部位报告", () => {
    const out = renderTemplate(["肝脏", "胆囊"], "肝脏回声均匀");
    expect(out).toContain("检查部位：肝脏");
    expect(out).toContain("检查部位：胆囊");
  });

  it("未命中模板的部位使用通用模板", () => {
    const out = renderTemplate(["未知部位" as any], "口述内容");
    expect(out).toContain("口述内容");
  });
});
