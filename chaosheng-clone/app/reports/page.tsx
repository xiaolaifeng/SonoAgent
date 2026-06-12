import Link from "next/link";
import { getDb } from "@/lib/db";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const db = await getDb();
  const reports = await db.listReports();
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">报告管理</h2>
      {reports.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>暂无报告，先去工作台生成一份吧。</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left" style={{ color: "var(--muted)" }}>
              <tr>
                <th className="p-3">创建时间</th>
                <th className="p-3">检查部位</th>
                <th className="p-3">模式</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3">{new Date(r.created_at).toLocaleString("zh-CN")}</td>
                  <td className="p-3">{JSON.parse(r.exam_parts).join("、") || "-"}</td>
                  <td className="p-3">{r.mode === "ai" ? "AI生成" : "模板匹配"}</td>
                  <td className="p-3 space-x-2">
                    <Link href={`/reports/${r.id}`} className="text-blue-600">查看</Link>
                    <DeleteButton id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href="/" className="inline-block mt-4 text-sm text-blue-600">← 返回工作台</Link>
    </div>
  );
}
