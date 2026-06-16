"use client";

export function ReportView({ content, generating, onSave, saved }: {
  content: string;
  generating: boolean;
  onSave: () => void;
  saved: boolean;
}) {
  if (!content && !generating) return null;
  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">生成报告</h3>
        {content && !generating && (
          <button onClick={onSave} disabled={saved}
            className="px-4 py-1.5 rounded-lg text-white text-sm disabled:opacity-50"
            style={{ background: "var(--brand)" }}>
            {saved ? "已保存" : "保存到报告管理"}
          </button>
        )}
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
        {content}
        {generating && <span className="animate-pulse">▍</span>}
      </pre>
    </div>
  );
}
