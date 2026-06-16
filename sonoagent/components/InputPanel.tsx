"use client";

export function InputPanel({ text, setText, onGenerate, generating }: {
  text: string;
  setText: (s: string) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-semibold mb-1">文本直接输入</h3>
        <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>直接输入文本内容生成报告</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="请输入超声检查的文本内容..."
          className="w-full h-32 p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          onClick={onGenerate}
          disabled={!text.trim() || generating}
          className="mt-3 px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
          style={{ background: "var(--brand)" }}>
          {generating ? "生成中..." : "生成报告"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5 opacity-60" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold mb-1">实时语音录制</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>通过麦克风实时录制（即将上线）</p>
          <button disabled className="mt-3 px-4 py-1.5 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }}>
            开始录制
          </button>
        </div>
        <div className="bg-white rounded-xl border p-5 opacity-60" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold mb-1">音频文件上传</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>上传音频进行识别（即将上线）</p>
          <button disabled className="mt-3 px-4 py-1.5 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }}>
            选择音频文件
          </button>
        </div>
      </div>
    </div>
  );
}
