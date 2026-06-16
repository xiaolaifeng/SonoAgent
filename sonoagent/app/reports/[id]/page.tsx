import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const report = await db.getReport(id);
  if (!report) notFound();

  return (
    <div>
      <Link href="/reports" className="text-sm text-blue-600">← 返回列表</Link>
      <h2 className="text-xl font-semibold mt-3 mb-4">报告详情</h2>
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{report.report_content}</pre>
      </div>
    </div>
  );
}
