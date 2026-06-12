import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

export interface ReportRow {
  id: string;
  mode: string;
  exam_parts: string; // JSON string（读取时 JSON.parse）
  input_text: string;
  report_content: string;
  model: string;
  output_mode: string;
  created_at: number;
}

export interface CreateReportInput {
  mode: string;
  exam_parts: string[]; // 调用方传数组，内部转 JSON 存储
  input_text: string;
  report_content: string;
  model: string;
  output_mode: string;
}

export interface DB {
  createReport(input: CreateReportInput): Promise<string>;
  getReport(id: string): Promise<ReportRow | undefined>;
  listReports(): Promise<ReportRow[]>;
  deleteReport(id: string): Promise<void>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  exam_parts TEXT NOT NULL,
  input_text TEXT NOT NULL,
  report_content TEXT NOT NULL,
  model TEXT NOT NULL,
  output_mode TEXT NOT NULL,
  created_at INTEGER NOT NULL
);`;

export async function createDb(url = "file:data.db"): Promise<DB> {
  const client = createClient({ url });
  await client.execute(SCHEMA);

  return {
    async createReport(input) {
      const id = randomUUID();
      const created_at = Date.now();
      await client.execute({
        sql: `INSERT INTO reports (id, mode, exam_parts, input_text, report_content, model, output_mode, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, input.mode, JSON.stringify(input.exam_parts), input.input_text, input.report_content, input.model, input.output_mode, created_at],
      });
      return id;
    },
    async getReport(id) {
      const res = await client.execute({ sql: `SELECT * FROM reports WHERE id = ?`, args: [id] });
      return (res.rows[0] ?? undefined) as ReportRow | undefined;
    },
    async listReports() {
      const res = await client.execute(`SELECT * FROM reports ORDER BY created_at DESC`);
      return res.rows as ReportRow[];
    },
    async deleteReport(id) {
      await client.execute({ sql: `DELETE FROM reports WHERE id = ?`, args: [id] });
    },
  };
}

// 进程级单例（生产路径用文件库）
let _dbPromise: Promise<DB> | null = null;
export function getDb(): Promise<DB> {
  if (!_dbPromise) _dbPromise = createDb(process.env.DB_PATH ?? "file:data.db");
  return _dbPromise;
}
