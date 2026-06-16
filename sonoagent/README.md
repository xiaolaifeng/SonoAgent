# SonoAgent

> A streaming LLM agent that turns a clinician's dictated ultrasound exam into a standardized, ready-to-sign ultrasound report.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-149eca) ![AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-v6-000) ![License](https://img.shields.io/badge/license-MIT-blue)

<!-- TODO: drop a demo screenshot or GIF here — the streaming report view is the money shot. -->

SonoAgent is a full-stack **medical-document AI** app. A sonographer types their exam findings; an LLM **streams** back a properly formatted *Ultrasound Medicine Report* — the layout a department actually prints and signs. A deterministic template engine acts as a **zero-LLM fallback** for the seven most common exam types, so the app is useful even offline or without an API key.

The interesting engineering problem here is **constrained generation for clinical documents**: the model must emit a fixed plain-text layout (no Markdown, no hallucinated headers) that drops straight into a hospital's print template. That constraint drove the dual-mode design and the streaming pipeline.

---

## ✨ Features

- **Two generation modes**
  - **AI mode** — streams a formatted report from dictation via an OpenAI-compatible LLM (default: ZhipuAI **GLM-4.5**). Token-by-token rendering.
  - **Template mode** — assembles a report locally from **7 prebuilt organ templates** (obstetrics, gynecology, cardiac, thyroid, liver, gallbladder, carotid). No model call, fully deterministic — the reliable fallback.
- **Streaming UI** — token-by-token rendering, toggleable to batch render (accumulate then show).
- **Multi-organ exams** — combine one or more exam parts in a single report.
- **Auth** — JWT login (`jose`, HS256) protecting every route via Next.js middleware; 7-day cookie session.
- **Report management** — reports persist to SQLite: list, view, delete (SSR).
- **Pluggable model** — any OpenAI-compatible endpoint works (ZhipuAI, OpenAI, DeepSeek, a local Ollama instance…).

---

## 🧠 How it works

```
                   ┌─────────────┐
 dictation  ─────► │  Report     │  mode = "ai"      ┌──────────────┐
 (text)           │  Config     │ ────────────────► │ LLM (stream) │ ──► formatted report (token stream)
                  │  (parts +   │                   └──────────────┘
                  │   mode)     │  mode = "template"
                  └─────────────┘ ────────────────► template renderer ──► formatted report (instant, no LLM)
```

- **AI mode** uses a strict system prompt that casts the model as an experienced ultrasound physician and forces a fixed **plain-text** report skeleton (`送检日期 / 检查部位 / 超声描述【per organ】/ 超声提示 / 检查医生 / 报告日期`). Each selected organ becomes its own bracketed paragraph.
- **Template mode** pulls canned normal-findings text per organ and stitches the same skeleton together locally — no network, no cost, no latency.

Both modes produce identical-shaped output, so downstream (view / persist / print) doesn't care which path ran.

---

## 🛠 Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router, Turbopack, `output: standalone`) |
| UI | **React 19**, Tailwind CSS 4 |
| AI | **Vercel AI SDK v6** (`streamText`), `@ai-sdk/openai` |
| Model | ZhipuAI GLM-4.5 (OpenAI-compatible) — swappable |
| Database | libSQL / **SQLite** (`@libsql/client`) |
| Auth | **jose** (JWT, HS256) |
| Testing | **Vitest** |

---

## 📁 Project structure

```
app/
  api/
    auth/route.ts            # login (issue JWT)
    generate/route.ts        # report generation: AI stream | template
    reports/route.ts         # report CRUD
    reports/[id]/route.ts    # single report
  page.tsx                   # workspace (generate)
  reports/page.tsx           # report list (SSR)
  reports/[id]/page.tsx      # report detail
  login/page.tsx
components/                  # Header, InputPanel, ReportConfig, ReportView, DeleteButton
lib/
  ai.ts                      # system prompt + streamText
  auth.ts                    # JWT sign/verify + credentials
  db.ts                      # libSQL report persistence (singleton)
  templates.ts               # 7 organ templates
  template-render.ts         # deterministic report assembler
proxy.ts                     # middleware: JWT gate on all routes
__tests__/                   # db.test.ts, template-render.test.ts
deploy/                      # start.sh + nginx.conf (self-host)
```

---

## 🚀 Getting started (local)

**Prereqs:** Node.js ≥ 20, an API key for any OpenAI-compatible model.

```bash
git clone <your-repo-url> sonoagent
cd sonoagent
npm install
cp .env.example .env.local      # fill in your keys
npm run dev                     # http://localhost:3000
```

Log in with the credentials from `.env.local` (default `doctor1` / `changeme`), pick exam parts, type findings, generate.

```bash
npm test          # vitest run
npm run build     # production build (standalone output → .next/standalone)
```

---

## 🔐 Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ZHIPU_API_KEY` | — | **Required.** API key for the LLM provider. |
| `ZHIPU_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` | Any OpenAI-compatible endpoint. |
| `ZHIPU_MODEL` | `glm-4.5` | Model id. |
| `AUTH_USERNAME` | `doctor1` | Simple login username. |
| `AUTH_PASSWORD` | `changeme` | Simple login password. **Change in prod.** |
| `JWT_SECRET` | `dev-secret-please-change` | JWT signing secret. **Set a long random string in prod.** |
| `DB_PATH` | `file:data.db` | SQLite path (local) or `libsql://…` URL (Turso). |

---

## ☁️ Deployment

SonoAgent ships preconfigured for **standalone + nginx** self-hosting (that's what `deploy/` is for). Vercel works too, with two adjustments.

### Option A — Self-host: standalone + nginx (preconfigured, persistent SQLite)

This is the path the repo is wired for. SQLite lives on the server, so reports persist naturally.

1. **Build** the standalone server:
   ```bash
   npm run build
   ```
   Produces `.next/standalone/` (a self-contained `server.js`).
2. **Ship** to your server: `.next/standalone`, `.next/static`, `public/`, your `.env`, and `deploy/`.
3. **Run** on the server:
   ```bash
   PORT=3000 bash deploy/start.sh     # sources .env, kills old proc on the port, runs node server.js
   ```
4. **Nginx** reverse proxy — copy `deploy/nginx.conf` into `/etc/nginx/conf.d/` and reload. It serves the app under `/chaosheng` (matching `next.config.ts`'s `basePath`).

   > ⚠️ **The single most important nginx line:** `proxy_buffering off;`. Without it, nginx buffers the AI stream and the report won't render until the *entire* response finishes (30–60s for GLM). The config also sets 300s timeouts because report generation is slow.

### Option B — Vercel (quick demo, or with Turso for persistence)

Two things differ from self-hosting:

1. **Drop the `basePath`.** `next.config.ts` hardcodes `basePath: "/chaosheng"` for the nginx sub-path. On Vercel you want the root:
   ```ts
   // next.config.ts — Vercel version
   const nextConfig: NextConfig = {
     output: "standalone",
     // basePath removed; app served at /
     env: { NEXT_PUBLIC_BASE_PATH: "" },
   };
   ```
2. **SQLite is ephemeral on serverless** — writes to `data.db` vanish on cold starts. For a persistent demo, swap in **Turso** (libSQL's cloud; the `@libsql/client` you already use supports it). One small change in `lib/db.ts`:
   ```ts
   const client = createClient({
     url: process.env.DB_PATH!,                       // libsql://<your-db>.turso.io
     authToken: process.env.TURSO_AUTH_TOKEN,         // add this
   });
   ```
   Then in Vercel: **New Project → import repo → set env vars** (`ZHIPU_API_KEY`, `AUTH_USERNAME`, `AUTH_PASSWORD`, `JWT_SECRET`, `DB_PATH`, `TURSO_AUTH_TOKEN`) → deploy. Streaming responses work natively on Vercel (no nginx buffering to worry about).

> Voice/audio input UI is placeholder only — see Roadmap.

---

## 🗺 Roadmap

- [ ] Real-time voice recording (mic) + transcription
- [ ] Audio file upload → speech-to-text → report
- [ ] Report **PDF export** (print-ready)
- [ ] Editable template library (add custom organs/findings)
- [ ] Multi-user / department accounts

---

## 📄 License

MIT © Xiaofeng Jiao
