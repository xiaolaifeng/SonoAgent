# 超声智能体复刻 — 设计文档

- **日期**：2026-06-12
- **状态**：待实现（设计已与用户确认）
- **目标系统（参照）**：方思润博「AI语音超声报告生成工作台」 <https://fsrbtech.com/chaosheng/dashboard>
- **本项目目的**：以「超声报告生成智能体」为案例，学习 AI 应用工程师全栈开发技能

---

## 1. 背景与目标

复刻目标系统的核心能力，作为学习载体。本阶段交付**快速原型**：先跑通「文本输入 → AI 生成结构化超声报告 → 流式输出 → 展示/保存」最短闭环，形态接近原系统（含工作台 + 报告管理）。

- **推进方式**：快速原型优先（先跑通核心链路，再迭代）
- **实现深度**：分层规范版（方案 2）

---

## 2. 范围

### 2.1 本期 MVP（In Scope）
- **工作台页面**：报告配置（生成模式 / 检查项目 / 输出方式）+ 文本直接输入 + 流式生成报告 + 保存
- **报告管理页面**：报告列表 + 详情查看 + 删除
- 报告持久化（SQLite）
- 两种生成模式：**模板匹配**（规则式）+ **AI 生成**（智谱 GLM）
- 流式 / 非流式两种输出
- 最简固定账号登录

### 2.2 非目标（YAGNI，留后续迭代）
- 实时麦克风录音 / 音频文件上传 + ASR 语音识别（工作台的语音/音频卡片先做占位按钮）
- 完整用户注册 / 多用户体系
- 报告导出 PDF / 打印
- 多用户权限管理

---

## 3. 技术决策

| 维度 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js（App Router）+ TypeScript + React | 全栈一体，AI SDK 原生支持流式输出 |
| 样式 | Tailwind CSS | 快速还原原系统卡片/配色风格 |
| AI | Vercel AI SDK + 智谱 GLM（`@ai-sdk/zhipu`） | 用户已有 GLM key；OpenAI 兼容接口 |
| 存储 | SQLite（`better-sqlite3`） | 文件落地、零配置、报告可回看 |
| 登录鉴权 | 固定账号 + httpOnly cookie（`jose` 签发 token） | 快速原型够用，无需数据库用户表 |

> **Windows 原生模块风险**：`better-sqlite3` 在 Windows 下偶发原生编译问题。若构建失败，降级为 `@libsql/client`（纯 WASM/HTTP，零编译）或 Node 22+ 内置 `node:sqlite`。届时在实现时确认。

---

## 4. 架构设计

### 4.1 项目布局
项目代码放在独立的 `chaosheng-clone/` 子目录（与工作区内既有的小说写作文件隔离）：

```
d:/workspace/aigent-超声/
├─ chaosheng-clone/          ← 本项目（Next.js 应用）
├─ docs/superpowers/specs/   ← 设计文档（本文件所在）
├─ 引导.md / 章节/           ← 既有的小说写作文件，保留不动
└─ *.png                     ← 原系统参考截图
```

### 4.2 应用目录结构（App Router）
```
chaosheng-clone/
├─ app/
│  ├─ layout.tsx              # 顶栏 + 页脚全局布局
│  ├─ page.tsx                # 工作台（配置 + 输入 + 生成）
│  ├─ reports/page.tsx        # 报告管理列表
│  ├─ reports/[id]/page.tsx   # 报告详情
│  ├─ login/page.tsx          # 登录页
│  └─ api/
│     ├─ auth/route.ts        # 登录校验 + cookie 签发
│     └─ generate/route.ts    # 报告生成（流式 SSE）
├─ lib/
│  ├─ db.ts                   # SQLite 连接 + 建表 + CRUD
│  ├─ ai.ts                   # GLM 客户端 + Prompt 构建
│  ├─ templates.ts            # 7 个检查部位的报告模板
│  └─ auth.ts                 # cookie 签发/校验
├─ components/                # 配置面板 / 输入卡片 / 报告展示等
├─ middleware.ts              # 未登录重定向到 /login
├─ .env.local                 # GLM key、模型名、登录账号、JWT 密钥
└─ package.json
```

### 4.3 模块职责
- `app/page.tsx` 工作台：配置面板 + 文本输入 + 触发生成 + 流式展示 + 保存
- `app/api/generate/route.ts`：入参 `{ mode, parts, text, outputMode }`；模板模式直接拼装返回，AI 模式调 GLM 流式返回
- `lib/ai.ts`：封装智谱 GLM 客户端与系统/用户 Prompt 模板
- `lib/templates.ts`：产科/妇科/心脏/甲状腺/肝脏/胆囊/颈动脉 7 部位报告模板
- `lib/db.ts`：SQLite 连接、建表、报告 CRUD
- `lib/auth.ts` + `app/api/auth/route.ts` + `middleware.ts`：固定账号校验、cookie 签发/校验、路由保护

---

## 5. 数据模型（SQLite）

`reports` 表：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | TEXT PK | 报告 ID（如 `crypto.randomUUID()`） |
| `mode` | TEXT | `template` \| `ai` |
| `exam_parts` | TEXT | JSON 数组，如 `["产科","心脏"]` |
| `input_text` | TEXT | 用户输入的口述文本 |
| `report_content` | TEXT | 生成的报告正文（Markdown） |
| `model` | TEXT | `glm-4-plus` 等；模板模式记 `template` |
| `output_mode` | TEXT | `stream` \| `full` |
| `created_at` | INTEGER | 创建时间戳 |

> 配置项（mode / parts / outputMode）不落库，由前端 state 管理；只在「保存报告」时随报告一起持久化。

---

## 6. AI 链路 & Prompt

### 6.1 模板匹配模式（规则式，不调 LLM）
- 按选中部位从 `lib/templates.ts` 取对应模板
- 用简单规则从口述文本提取数值/关键词填入模板
- 即时返回完整报告，不走流式

### 6.2 AI 生成模式（调智谱 GLM）
- **System**：「你是一名经验丰富的超声科医生，擅长根据超声检查口述生成规范的结构化报告。」
- **User**：「依据以下超声检查口述，生成结构化报告。检查部位：{parts}。要求输出包含：① 检查信息 ② 超声所见 ③ 超声提示 ④ 建议。使用 Markdown 格式。口述内容：{text}」
- 调用：`streamText({ model: zhipu('glm-4-plus'), system, messages })`
- 流式模式：返回 `ReadableStream`（SSE），前端逐字渲染；非流式模式：`await streamText` 聚合后一次性返回

### 6.3 流式传输
- `/api/generate` 返回标准 AI SDK 数据流（`result.toDataStreamResponse()`）
- 前端用 `useChat` / `useCompletion` 或手动 `fetch` + ReadableStream 消费

---

## 7. 页面 & 交互

### 7.1 工作台 `/`
- **报告配置卡**：单选（生成模式）+ 多选（检查部位，7 个）+ 单选（输出方式）
- **输入区**：文本框 + 「生成报告」按钮（文本为空时 disabled）；语音/音频卡片做占位（点击提示「即将上线」）
- **报告区**：流式渲染生成内容 + 「保存到报告管理」按钮

### 7.2 报告管理 `/reports`
- 表格列表：创建时间 / 部位 / 模式 / 操作（查看 / 删除）
- 详情页 `/reports/[id]`：渲染完整报告 Markdown

### 7.3 登录 `/login`
- 用户名 + 密码 → 与 `.env.local` 配置校验 → 签发 httpOnly cookie → 跳转 `/`
- `middleware.ts`：未登录访问 `/` 与 `/reports/*` 时重定向到 `/login`

---

## 8. 环境变量（`.env.local`）
```
ZHIPU_API_KEY=你的智谱key
ZHIPU_MODEL=glm-4-plus
AUTH_USERNAME=doctor1
AUTH_PASSWORD=自定义密码
JWT_SECRET=随机长字符串
```

> 模型名可在 `ZHIPU_MODEL` 配置，默认 `glm-4-plus`；如智谱推出更新模型，改这里即可。

---

## 9. 错误处理 & 降级
- **GLM 调用失败**：前端显示错误 + 「重试」按钮；不保存报告
- **key 缺失/无效**：AI 模式下返回明确错误提示，引导检查 `.env.local`；不静默失败
- **流式中断**：保留已生成内容，提示「连接中断，可重试」
- **数据库写入失败**：报告已在前端展示，提示「保存失败，请重试」

---

## 10. 实现里程碑（逐步跑通）
1. 脚手架（`create-next-app`）+ 顶栏/页脚布局 + Tailwind
2. 工作台 UI（报告配置卡 + 文本输入，纯静态、还原原系统视觉）
3. GLM 接入 + 流式生成（AI 模式跑通「文本 → 报告」）
4. 报告存 SQLite + 报告管理页（列表 / 详情 / 删除）
5. 模板匹配模式
6. 最简登录（固定账号 + cookie + middleware）

---

## 11. 测试策略
- **模板模式**（`lib/templates.ts`）：纯函数，单元测试覆盖关键词提取与模板拼装
- **AI 链路**：集成测试中 mock GLM 响应，避免依赖真实 key 与费用
- **DB 层**（`lib/db.ts`）：CRUD 单元测试（临时数据库）
- **关键页面**：手动验证流式渲染、保存、报告列表回看、登录重定向

---

## 12. 后续迭代（方案 3 储备，本期不做）
音频上传 + ASR 语音识别、实时麦克风录音、报告导出/打印、模板匹配规则增强、完整用户体系。
