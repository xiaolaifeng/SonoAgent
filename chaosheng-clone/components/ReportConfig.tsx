"use client";

export type GenMode = "template" | "ai";
export type OutputMode = "stream" | "full";
export type ExamPart = "产科" | "妇科" | "心脏" | "甲状腺" | "肝脏" | "胆囊" | "颈动脉";

export const ALL_PARTS: ExamPart[] = ["产科", "妇科", "心脏", "甲状腺", "肝脏", "胆囊", "颈动脉"];

export interface ConfigValue {
  genMode: GenMode;
  parts: ExamPart[];
  outputMode: OutputMode;
}

export function ReportConfig({ value, onChange }: {
  value: ConfigValue;
  onChange: (v: ConfigValue) => void;
}) {
  const togglePart = (p: ExamPart) => {
    const exists = value.parts.includes(p);
    onChange({ ...value, parts: exists ? value.parts.filter(x => x !== p) : [...value.parts, p] });
  };

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
      <h3 className="font-semibold">报告配置</h3>

      <div>
        <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>报告生成模式</p>
        <div className="flex gap-4 text-sm">
          {([["template", "模板匹配模式"], ["ai", "AI生成模式"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="genMode" checked={value.genMode === k}
                onChange={() => onChange({ ...value, genMode: k })} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>检查项目（可多选）</p>
        <div className="flex flex-wrap gap-3 text-sm">
          {ALL_PARTS.map(p => (
            <label key={p} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={value.parts.includes(p)} onChange={() => togglePart(p)} />
              {p}
            </label>
          ))}
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
          可选择一个或多个检查项目，系统将根据关键词自动匹配对应模板生成报告
        </p>
      </div>

      <div>
        <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>输出方式</p>
        <div className="flex gap-4 text-sm">
          {([["stream", "流式输出"], ["full", "非流式输出"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="outputMode" checked={value.outputMode === k}
                onChange={() => onChange({ ...value, outputMode: k })} />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
