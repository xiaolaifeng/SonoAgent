import { describe, it, expect, beforeEach } from "vitest";
import { createDb, type DB } from "../lib/db";

let db: DB;
beforeEach(async () => {
  db = await createDb(":memory:"); // 内存库，测试隔离
});

describe("db reports CRUD", () => {
  it("能创建并按 id 读取报告", async () => {
    const id = await db.createReport({ mode: "ai", exam_parts: ["心脏"], input_text: "t", report_content: "c", model: "glm-4-plus", output_mode: "stream" });
    const got = await db.getReport(id);
    expect(got?.report_content).toBe("c");
    expect(got?.mode).toBe("ai");
  });

  it("能列出与删除报告", async () => {
    const id = await db.createReport({ mode: "template", exam_parts: ["肝脏"], input_text: "t", report_content: "c", model: "template", output_mode: "full" });
    expect(await db.listReports()).toHaveLength(1);
    await db.deleteReport(id);
    expect(await db.listReports()).toHaveLength(0);
  });

  it("列表按创建时间倒序", async () => {
    await db.createReport({ mode: "ai", exam_parts: [], input_text: "a", report_content: "1", model: "m", output_mode: "stream" });
    await new Promise((resolve) => setTimeout(resolve, 10)); // 确保时间戳不同
    await db.createReport({ mode: "ai", exam_parts: [], input_text: "b", report_content: "2", model: "m", output_mode: "stream" });
    const list = await db.listReports();
    expect(list[0].report_content).toBe("2");
  });
});
