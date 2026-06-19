"use client";

import { useState } from "react";
import { ReportConfig, type ConfigValue } from "@/components/ReportConfig";
import { InputPanel } from "@/components/InputPanel";
import { ReportView } from "@/components/ReportView";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Home() {
  const [config, setConfig] = useState<ConfigValue>({ genMode: "ai", parts: [], outputMode: "stream" });
  const [text, setText] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleGenerate() {
    if (config.parts.length === 0) {
      alert("请至少选择一个检查项目");
      return;
    }
    setContent(""); setSaved(false); setGenerating(true);

    if (config.genMode === "template") {
      const res = await fetch(`${BP}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "template", parts: config.parts, text }),
      });
      const data = await res.json();
      setContent(data.content);
      setGenerating(false);
      return;
    }

    // AI 流式：纯文本流（无需解析协议）。输出方式控制渲染：流式=逐字，非流式=攒齐后一次显示
    const res = await fetch(`${BP}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "ai", parts: config.parts, text }),
    });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "生成失败");
      setGenerating(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffered = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (config.outputMode === "stream") {
        setContent(prev => prev + chunk);   // 流式：逐字渲染
      } else {
        buffered += chunk;                  // 非流式：先攒齐
      }
    }
    if (config.outputMode === "full") setContent(buffered);
    setGenerating(false);
  }

  async function handleSave() {
    const res = await fetch(`${BP}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: config.genMode,
        exam_parts: config.parts,
        input_text: text,
        report_content: content,
        model: config.genMode === "ai" ? "glm-4-plus" : "template",
        output_mode: config.outputMode,
      }),
    });
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-4">
      <ReportConfig value={config} onChange={setConfig} />
      <p className="text-center text-sm" style={{ color: "var(--muted)" }}>语音、音频、文本选择任意方式生成报告</p>
      <InputPanel text={text} setText={setText} onGenerate={handleGenerate} generating={generating} />
      <ReportView content={content} generating={generating} onSave={handleSave} saved={saved} />
    </div>
  );
}
