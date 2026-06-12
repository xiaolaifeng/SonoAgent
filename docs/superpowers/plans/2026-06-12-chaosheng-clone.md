# 超声智能体复刻 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 复刻「AI语音超声报告生成工作台」的核心能力——文本输入 → 智谱 GLM 生成结构化超声报告 → 流式输出 → 持久化与回看。

**Architecture:** Next.js（App Router）全栈单体应用。前端 React + Tailwind 还原工作台视觉；`/api/generate` 按生成模式（模板匹配/AI）分流，AI 模式经 Vercel AI SDK 调智谱 GLM 流式返回；报告落 SQLite；固定账号 + cookie 鉴权。

**Tech Stack:** Next.js 15 (App Router) · TypeScript · React · Tailwind CSS · Vercel AI SDK v5 (`ai` + `@ai-sdk/openai` 的 `createOpenAI` 指向智谱 GLM 的 OpenAI 兼容端点) · better-sqlite3 · jose

**Spec:** [docs/superpowers/specs/2026-06-12-chaosheng-clone-design.md](../specs/2026-06-12-chaosheng-clone-design.md)

---

## 测试策略说明

- **纯逻辑层（`lib/`）严格 TDD**：模板渲染、DB CRUD、鉴权工具——先写测试、再实现。
- **UI 与流式 API 用「实现 + 手动验证」**：前端组件与 SSE 流式的单测搭造成本高、对初学者收益低，改用浏览器手动验证清单（每个任务给出验证步骤）。
- 频繁提交：每个 Task 结束 commit 一次。

## 文件结构

```
chaosheng-clone/
├─ app/
│  ├─ layout.tsx               # 全局布局（顶栏 + 页脚）
│  ├─ globals.css              # Tailwind + 配色变量
│  ├─ page.tsx                 # 工作台（配置 + 输入 + 流式报告）
│  ├─ reports/page.tsx         # 报告列表
│  ├─ reports/[id]/page.tsx    # 报告详情
│  ├─ login/page.tsx           # 登录页
│  └─ api/
│     ├─ generate/route.ts     # 报告生成（模板 / AI 流式）
│     ├─ reports/route.ts      # 列表 / 保存
│     ├─ reports/[id]/route.ts # 详情 / 删除
│     └─ auth/route.ts         # 登录校验 + 签发 cookie
├─ lib/
│  ├─ db.ts                    # SQLite 连接 + 建表 + CRUD
│  ├─ ai.ts                    # GLM 客户端 + Prompt 构建
│  ├─ templates.ts             # 7 部位报告模板数据
│  ├─ template-render.ts       # 模板渲染纯函数（关键词提取 + 拼装）
│  └─ auth.ts                  # cookie 签发 / 校验（jose）
├─ components/
│  ├─ Header.tsx               # 顶栏
│  ├─ ReportConfig.tsx         # 报告配置面板
│  ├─ InputPanel.tsx           # 输入区
│  └─ ReportView.tsx           # 报告展示（流式渲染）
├─ middleware.ts               # 未登录重定向
├─ __tests__/                  # 单元测试
├─ .env.example / .env.local
├─ .gitignore
└─ package.json
```

---

## Task 1: 脚手架与依赖

**Files:**
- Create: `chaosheng-clone/`（整个 Next.js 工程）
- Create: `chaosheng-clone/.env.example`, `chaosheng-clone/.gitignore`

- [ ] **Step 1: 创建 Next.js 工程**

在 `d:/workspace/aigent-超声` 下执行（会生成 `chaosheng-clone/` 子目录）：

```bash
cd "d:/workspace/aigent-超声"
npx create-next-app@latest chaosheng-clone --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --eslint --turbopack
```

交互提示如出现，全部回车选默认。完成后进入目录：

```bash
cd chaosheng-clone
```

- [ ] **Step 2: 安装业务依赖**

```bash
npm install ai @ai-sdk/openai better-sqlite3 jose
npm install -D @types/better-sqlite3 vitest
```

> 用 `@ai-sdk/openai` 的 `createOpenAI` 指向智谱的 OpenAI 兼容端点（而非 `@ai-sdk/zhipu`），因为这是 AI SDK 官方最稳定、文档最全的自定义 provider 方式，跨版本可靠。

> 测试用 vitest（轻量、对 Next 友好）。后续在 `package.json` 加 `"test": "vitest run"`。

- [ ] **Step 3: 配置 package.json 脚本**

编辑 `chaosheng-clone/package.json` 的 `scripts`，确保包含：

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: 创建 .env.example**

`chaosheng-clone/.env.example`：

```bash
# 智谱 GLM
ZHIPU_API_KEY=在此填入你的智谱 API Key
ZHIPU_MODEL=glm-4-plus

# 最简登录（固定账号）
AUTH_USERNAME=doctor1
AUTH_PASSWORD=changeme
JWT_SECRET=请改成一串足够长的随机字符串
```

- [ ] **Step 5: 创建 .env.local（本地不入库）**

`chaosheng-clone/.env.local`（用户填真实值）：

```bash
ZHIPU_API_KEY=你的真实key
ZHIPU_MODEL=glm-4-plus
AUTH_USERNAME=doctor1
AUTH_PASSWORD=***REMOVED***
JWT_SECRET=***REMOVED***
```

- [ ] **Step 6: 确认 .gitignore 覆盖敏感/生成物**

`create-next-app` 已生成 `.gitignore`。确认包含以下行（缺则补）：

```gitignore
.env*.local
*.db
node_modules/
.next/
```

- [ ] **Step 7: Commit**

```bash
cd "d:/workspace/aigent-超声"
git add chaosheng-clone
git commit -m "chore: 初始化 Next.js 工程与依赖

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: 全局布局与配色

**Files:**
- Modify: `chaosheng-clone/app/globals.css`
- Modify: `chaosheng-clone/app/layout.tsx`
- Create: `chaosheng-clone/components/Header.tsx`

- [ ] **Step 1: 写 globals.css 配色变量**

替换 `app/globals.css` 内容为：

```css
@import "tailwindcss";

:root {
  --brand: #2563eb;
  --brand-dark: #1e40af;
  --bg: #f5f7fa;
  --card: #ffffff;
  --border: #e5e7eb;
  --muted: #6b7280;
}

body {
  background: var(--bg);
  color: #1f2937;
}
```

- [ ] **Step 2: 写 Header 组件**

`components/Header.tsx`：

```tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white border-b" style={{ borderColor: "var(--border)" }}>
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
               style={{ background: "var(--brand)" }}>超</div>
          <div>
            <h1 className="text-base font-semibold leading-tight">AI语音超声报告生成工作台</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>超声智能体（复刻学习版）</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-blue-600">首页</Link>
          <Link href="/reports" className="hover:text-blue-600">报告管理</Link>
          <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">D</span>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: 写 layout.tsx**

替换 `app/layout.tsx`：

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "AI语音超声报告生成工作台",
  description: "超声智能体 - 复刻学习版",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">{children}</main>
        <footer className="border-t py-4 text-center text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          © 2026 超声智能体（复刻学习版）
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 启动验证**

```bash
cd chaosheng-clone && npm run dev
```
浏览器打开 <http://localhost:3000>，确认顶栏 + 页脚渲染、配色为蓝色品牌色。Ctrl+C 停止。

- [ ] **Step 5: Commit**

```bash
git add chaosheng-clone/app chaosheng-clone/components
git commit -m "feat: 全局布局与配色

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 报告配置面板组件

**Files:**
- Create: `chaosheng-clone/components/ReportConfig.tsx`

- [ ] **Step 1: 写 ReportConfig 组件**

`components/ReportConfig.tsx`：

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add chaosheng-clone/components/ReportConfig.tsx
git commit -m "feat: 报告配置面板组件

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 输入区与报告展示组件

**Files:**
- Create: `chaosheng-clone/components/InputPanel.tsx`
- Create: `chaosheng-clone/components/ReportView.tsx`

- [ ] **Step 1: 写 InputPanel 组件**

`components/InputPanel.tsx`：

```tsx
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
```

- [ ] **Step 2: 写 ReportView 组件**

`components/ReportView.tsx`：

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add chaosheng-clone/components/InputPanel.tsx chaosheng-clone/components/ReportView.tsx
git commit -m "feat: 输入区与报告展示组件

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 报告模板与渲染（TDD）

**Files:**
- Create: `chaosheng-clone/lib/templates.ts`
- Create: `chaosheng-clone/lib/template-render.ts`
- Test: `chaosheng-clone/__tests__/template-render.test.ts`

- [ ] **Step 1: 写模板数据**

`lib/templates.ts`：

```ts
export const REPORT_TEMPLATES: Record<string, string> = {
  产科: `# 超声检查报告\n\n## 检查部位：产科\n\n## 超声所见\n{content}\n\n## 超声提示\n宫内妊娠，请结合临床。\n\n## 建议\n定期产检随访。`,
  妇科: `# 超声检查报告\n\n## 检查部位：妇科\n\n## 超声所见\n{content}\n\n## 超声提示\n请结合临床进一步评估。\n\n## 建议\n必要时复查。`,
  心脏: `# 超声检查报告\n\n## 检查部位：心脏（超声心动图）\n\n## 超声所见\n{content}\n\n## 超声提示\n各房室大小及心功能在正常范围内（待补充）。\n\n## 建议\n结合临床综合判断。`,
  甲状腺: `# 超声检查报告\n\n## 检查部位：甲状腺\n\n## 超声所见\n{content}\n\n## 超声提示\n甲状腺未见明显异常（待补充）。\n\n## 建议\n定期随访复查。`,
  肝脏: `# 超声检查报告\n\n## 检查部位：肝脏\n\n## 超声所见\n{content}\n\n## 超声提示\n肝脏未见明显占位（待补充）。\n\n## 建议\n结合临床，必要时复查。`,
  胆囊: `# 超声检查报告\n\n## 检查部位：胆囊\n\n## 超声所见\n{content}\n\n## 超声提示\n胆囊未见明显异常（待补充）。\n\n## 建议\n结合临床评估。`,
  颈动脉: `# 超声检查报告\n\n## 检查部位：颈动脉\n\n## 超声所见\n{content}\n\n## 超声提示\n颈动脉未见明显斑块（待补充）。\n\n## 建议\n定期复查随访。`,
};
```

- [ ] **Step 2: 写失败测试**

`__tests__/template-render.test.ts`：

```ts
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
```

- [ ] **Step 3: 运行测试确认失败**

```bash
cd chaosheng-clone && npx vitest run __tests__/template-render.test.ts
```
Expected: FAIL（`renderTemplate` 未定义 / 模块不存在）

- [ ] **Step 4: 实现 renderTemplate**

`lib/template-render.ts`：

```ts
import { REPORT_TEMPLATES } from "./templates";

const GENERIC_TEMPLATE = `# 超声检查报告\n\n## 检查部位：{part}\n\n## 超声所见\n{content}\n\n## 超声提示\n请结合临床进一步评估。\n\n## 建议\n必要时复查。`;

/** 模板匹配模式：按选中部位拼接模板，填入口述文本。纯函数，不调 LLM。 */
export function renderTemplate(parts: string[], inputText: string): string {
  const blocks = parts.map(part => {
    const tpl = REPORT_TEMPLATES[part] ?? GENERIC_TEMPLATE.replace("{part}", part);
    return tpl.replace("{content}", inputText.trim() || "（未提供口述内容）");
  });
  return blocks.join("\n\n---\n\n");
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx vitest run __tests__/template-render.test.ts
```
Expected: PASS（3 passed）

- [ ] **Step 6: Commit**

```bash
git add chaosheng-clone/lib/templates.ts chaosheng-clone/lib/template-render.ts chaosheng-clone/__tests__ chaosheng-clone/package.json chaosheng-clone/package-lock.json
git commit -m "feat: 报告模板与模板渲染(TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: SQLite 数据层（TDD）

**Files:**
- Create: `chaosheng-clone/lib/db.ts`
- Test: `chaosheng-clone/__tests__/db.test.ts`

- [ ] **Step 1: 写失败测试**

`__tests__/db.test.ts`：

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createDb, type DB } from "../lib/db";

let db: DB;
beforeEach(() => {
  db = createDb(":memory:"); // 内存库，测试隔离
});

describe("db reports CRUD", () => {
  it("能创建并按 id 读取报告", () => {
    const id = db.createReport({ mode: "ai", exam_parts: ["心脏"], input_text: "t", report_content: "c", model: "glm-4-plus", output_mode: "stream" });
    const got = db.getReport(id);
    expect(got?.report_content).toBe("c");
    expect(got?.mode).toBe("ai");
  });

  it("能列出与删除报告", () => {
    const id = db.createReport({ mode: "template", exam_parts: ["肝脏"], input_text: "t", report_content: "c", model: "template", output_mode: "full" });
    expect(db.listReports()).toHaveLength(1);
    db.deleteReport(id);
    expect(db.listReports()).toHaveLength(0);
  });

  it("列表按创建时间倒序", () => {
    db.createReport({ mode: "ai", exam_parts: [], input_text: "a", report_content: "1", model: "m", output_mode: "stream" });
    db.createReport({ mode: "ai", exam_parts: [], input_text: "b", report_content: "2", model: "m", output_mode: "stream" });
    const list = db.listReports();
    expect(list[0].report_content).toBe("2");
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd chaosheng-clone && npx vitest run __tests__/db.test.ts
```
Expected: FAIL（`createDb` 未定义）

- [ ] **Step 3: 实现 db.ts**

`lib/db.ts`：

```ts
import Database from "better-sqlite3";
import type { Database as DBType } from "better-sqlite3";
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
  createReport(input: CreateReportInput): string;
  getReport(id: string): ReportRow | undefined;
  listReports(): ReportRow[];
  deleteReport(id: string): void;
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

export function createDb(path = "data.db"): DB {
  const sqlite: DBType = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(SCHEMA);

  return {
    createReport(input) {
      const id = randomUUID();
      const created_at = Date.now();
      sqlite.prepare(
        `INSERT INTO reports (id, mode, exam_parts, input_text, report_content, model, output_mode, created_at)
         VALUES (@id, @mode, @exam_parts, @input_text, @report_content, @model, @output_mode, @created_at)`
      ).run({ id, created_at, ...input, exam_parts: JSON.stringify(input.exam_parts) });
      return id;
    },
    getReport(id) {
      return sqlite.prepare(`SELECT * FROM reports WHERE id = ?`).get(id) as ReportRow | undefined;
    },
    listReports() {
      return sqlite.prepare(`SELECT * FROM reports ORDER BY created_at DESC`).all() as ReportRow[];
    },
    deleteReport(id) {
      sqlite.prepare(`DELETE FROM reports WHERE id = ?`).run(id);
    },
  };
}

// 进程级单例（生产路径用文件库）
let _db: DB | null = null;
export function getDb(): DB {
  if (!_db) _db = createDb(process.env.DB_PATH ?? "data.db");
  return _db;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run __tests__/db.test.ts
```
Expected: PASS（3 passed）

> 若 `better-sqlite3` 在 Windows 编译失败：`npm uninstall better-sqlite3 && npm install @libsql/client`，并改写 `db.ts` 为 libsql（接口不同，需同步改）。先按 better-sqlite3 推进，遇阻再换。

- [ ] **Step 5: Commit**

```bash
git add chaosheng-clone/lib/db.ts chaosheng-clone/__tests__/db.test.ts
git commit -m "feat: SQLite 数据层与 CRUD(TDD)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: AI 客户端与 Prompt

**Files:**
- Create: `chaosheng-clone/lib/ai.ts`

- [ ] **Step 1: 写 AI 客户端**

`lib/ai.ts`：

```ts
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// 智谱 GLM 提供 OpenAI 兼容接口，用 createOpenAI 指向智谱 baseURL（AI SDK 官方自定义 provider 方式）
const zhipu = createOpenAI({
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  apiKey: process.env.ZHIPU_API_KEY ?? "",
  name: "zhipu",
});

export const MODEL_ID = process.env.ZHIPU_MODEL ?? "glm-4-plus";

/** 构建 AI 生成模式的 Prompt */
export function buildPrompt(parts: string[], inputText: string) {
  const system =
    "你是一名经验丰富的超声科医生，擅长根据超声检查口述生成规范、结构化的超声检查报告。" +
    "只输出报告内容，使用 Markdown 格式，包含：检查信息、超声所见、超声提示、建议四个部分。";
  const user =
    `请依据以下超声检查口述，生成结构化报告。\n` +
    `检查部位：${parts.join("、") || "未指定"}\n` +
    `口述内容：${inputText.trim()}`;
  return { system, user };
}

/** 流式生成报告，返回 AI SDK 的 streamText 结果 */
export function streamReport(parts: string[], inputText: string) {
  const { system, user } = buildPrompt(parts, inputText);
  return streamText({
    model: zhipu(MODEL_ID),
    system,
    messages: [{ role: "user", content: user }],
  });
}
```

- [ ] **Step 2: 手动验证（需真实 key）**

确认 `.env.local` 已填 `ZHIPU_API_KEY`。此步先不单独测，下一个 Task 在 API route 里联调。

- [ ] **Step 3: Commit**

```bash
git add chaosheng-clone/lib/ai.ts
git commit -m "feat: 智谱 GLM 客户端与 Prompt 构建

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: 报告生成 API（模板 + AI 流式）

**Files:**
- Create: `chaosheng-clone/app/api/generate/route.ts`

- [ ] **Step 1: 写 generate route**

`app/api/generate/route.ts`：

```ts
import { NextRequest } from "next/server";
import { createTextStreamResponse, toTextStream } from "ai";
import { streamReport } from "@/lib/ai";
import { renderTemplate } from "@/lib/template-render";

export const runtime = "nodejs"; // better-sqlite3 / 流式需要 Node 运行时

export async function POST(req: NextRequest) {
  const { mode, parts = [], text = "" } = await req.json().catch(() => ({}));

  if (!text?.trim()) {
    return Response.json({ error: "输入文本不能为空" }, { status: 400 });
  }

  // 模板匹配模式：直接拼装返回（非流式）
  if (mode === "template") {
    const content = renderTemplate(parts, text);
    return Response.json({ content });
  }

  // AI 生成模式：纯文本流（AI SDK v5，前端逐字渲染，无需解析协议）
  try {
    const result = streamReport(parts, text);
    return createTextStreamResponse({
      stream: toTextStream({ stream: result.stream }),
    });
  } catch (e: any) {
    return Response.json({ error: `生成失败：${e?.message ?? e}` }, { status: 500 });
  }
}
```

- [ ] **Step 2: 手动验证模板模式**

```bash
cd chaosheng-clone && npm run dev
```
另开终端：

```bash
curl -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"mode":"template","parts":["肝脏"],"text":"肝脏大小正常，回声均匀"}'
```
Expected: JSON 返回含「检查部位：肝脏」与口述文本。

- [ ] **Step 3: 手动验证 AI 流式模式**

```bash
curl -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"mode":"ai","parts":["心脏"],"text":"各房室大小正常，射血分数60%"}' --no-buffer
```
Expected: 流式返回 AI SDK 数据流（含逐段文本）。若报 key 错误，检查 `.env.local` 后重启 dev。

- [ ] **Step 4: Commit**

```bash
git add chaosheng-clone/app/api/generate/route.ts
git commit -m "feat: 报告生成 API(模板匹配+AI流式)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: 工作台接入流式生成

**Files:**
- Modify: `chaosheng-clone/app/page.tsx`

- [ ] **Step 1: 写工作台主页面**

替换 `app/page.tsx`：

```tsx
"use client";

import { useState } from "react";
import { ReportConfig, type ConfigValue } from "@/components/ReportConfig";
import { InputPanel } from "@/components/InputPanel";
import { ReportView } from "@/components/ReportView";

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
      const res = await fetch("/api/generate", {
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
    const res = await fetch("/api/generate", {
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
    const res = await fetch("/api/reports", {
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
```

> 注：AI 模式走纯文本流（AI SDK v5 的 `createTextStreamResponse` + `toTextStream`），前端用 `ReadableStream` 逐字渲染——原理直观、无需解析流协议，最适合学习。

- [ ] **Step 2: 手动验证**

```bash
npm run dev
```
浏览器 <http://localhost:3000>：选「AI生成模式 + 心脏」，输入「各房室大小正常 EF60%」，点生成 → 看到流式逐字渲染；点保存 → 「已保存」。

- [ ] **Step 3: Commit**

```bash
git add chaosheng-clone/app/page.tsx
git commit -m "feat: 工作台接入流式生成与保存

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: 报告管理（列表 / 详情 / 删除）

**Files:**
- Create: `chaosheng-clone/app/api/reports/route.ts`
- Create: `chaosheng-clone/app/api/reports/[id]/route.ts`
- Create: `chaosheng-clone/app/reports/page.tsx`
- Create: `chaosheng-clone/app/reports/[id]/page.tsx`

- [ ] **Step 1: 写 reports 列表/保存 API**

`app/api/reports/route.ts`：

```ts
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ reports: getDb().listReports() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = getDb().createReport({
    mode: body.mode,
    exam_parts: body.exam_parts ?? [],
    input_text: body.input_text ?? "",
    report_content: body.report_content ?? "",
    model: body.model ?? "unknown",
    output_mode: body.output_mode ?? "stream",
  });
  return Response.json({ id });
}
```

- [ ] **Step 2: 写 详情/删除 API**

`app/api/reports/[id]/route.ts`：

```ts
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = getDb().getReport(id);
  if (!report) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ report });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().deleteReport(id);
  return Response.json({ ok: true });
}
```

- [ ] **Step 3: 写报告列表页**

`app/reports/page.tsx`：

```tsx
import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const reports = getDb().listReports();
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
                    <form action={`/api/reports/${r.id}/delete`} method="post" className="inline">
                      <button type="submit" className="text-red-500">删除</button>
                    </form>
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
```

- [ ] **Step 4: 写报告详情页**

`app/reports/[id]/page.tsx`：

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = getDb().getReport(id);
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
```

- [ ] **Step 5: 补充删除表单的 server action**

列表页用了原生 form POST 到 `/api/reports/[id]/delete`，需要补一个处理。改为更简单的 client 删除更稳妥——把列表页「删除」改用如下 client 组件。

创建 `components/DeleteButton.tsx`：

```tsx
"use client";
import { useRouter } from "next/navigation";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="text-red-500"
      onClick={async () => {
        if (!confirm("确认删除该报告？")) return;
        await fetch(`/api/reports/${id}`, { method: "DELETE" });
        router.refresh();
      }}>
      删除
    </button>
  );
}
```

并将列表页删除单元改为 `<DeleteButton id={r.id} />`（去掉那个 form），并在文件顶部 `import { DeleteButton } from "@/components/DeleteButton"`。

- [ ] **Step 6: 手动验证**

```bash
npm run dev
```
- 在工作台生成并保存 1-2 份报告 → 访问 <http://localhost:3000/reports> 看到列表 → 点查看进详情 → 返回点删除 → 列表刷新。

- [ ] **Step 7: Commit**

```bash
git add chaosheng-clone/app/api/reports chaosheng-clone/app/reports chaosheng-clone/components/DeleteButton.tsx
git commit -m "feat: 报告管理(列表/详情/删除)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: 最简登录与鉴权

**Files:**
- Create: `chaosheng-clone/lib/auth.ts`
- Create: `chaosheng-clone/app/api/auth/route.ts`
- Create: `chaosheng-clone/app/login/page.tsx`
- Create: `chaosheng-clone/middleware.ts`

- [ ] **Step 1: 写 auth 工具（jose）**

`lib/auth.ts`：

```ts
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-please-change");
const COOKIE = "chaosheng_token";

export async function signToken(username: string) {
  return await new SignJWT({ username }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d").sign(SECRET);
}

export async function verifyToken(token?: string): Promise<boolean> {
  if (!token) return false;
  try { await jwtVerify(token, SECRET); return true; } catch { return false; }
}

export const COOKIE_NAME = COOKIE;
export const CREDENTIALS = {
  username: process.env.AUTH_USERNAME ?? "doctor1",
  password: process.env.AUTH_PASSWORD ?? "changeme",
};
```

- [ ] **Step 2: 写登录 API**

`app/api/auth/route.ts`：

```ts
import { NextRequest } from "next/server";
import { signToken, COOKIE_NAME, CREDENTIALS } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    const token = await signToken(username);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
      },
    });
  }
  return Response.json({ error: "用户名或密码错误" }, { status: 401 });
}
```

- [ ] **Step 3: 写登录页**

`app/login/page.tsx`：

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    if (res.ok) router.push("/");
    else setErr("用户名或密码错误");
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-semibold text-center mb-6">登录</h1>
      <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <input value={u} onChange={e => setU(e.target.value)} placeholder="用户名"
          className="w-full p-2.5 border rounded-lg text-sm" style={{ borderColor: "var(--border)" }} />
        <input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="密码"
          className="w-full p-2.5 border rounded-lg text-sm" style={{ borderColor: "var(--border)" }} />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: "var(--brand)" }}>
          登录
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: 写 middleware 保护路由**

`middleware.ts`（工程根）：

```ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-please-change");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api")) return NextResponse.next();

  const token = req.cookies.get("chaosheng_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

- [ ] **Step 5: 手动验证**

```bash
npm run dev
```
- 访问 <http://localhost:3000> → 被重定向到 /login → 用 `.env.local` 中的账号密码登录 → 跳回工作台 → 刷新仍保持登录（cookie）。

- [ ] **Step 6: Commit**

```bash
git add chaosheng-clone/lib/auth.ts chaosheng-clone/app/api/auth chaosheng-clone/app/login chaosheng-clone/middleware.ts
git commit -m "feat: 最简登录与鉴权

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 完成验证清单（全部 Task 完成后）

- [ ] 工作台：选 AI 模式 + 部位 + 文本 → 流式逐字生成报告
- [ ] 工作台：选模板模式 → 即时生成结构化报告
- [ ] 保存报告 → 报告管理列表可见 → 详情可查 → 可删除
- [ ] 未登录访问任意页 → 重定向登录页；登录后可访问
- [ ] `npm run build` 无报错
- [ ] `npm run test` 全部通过（模板渲染、DB CRUD）
