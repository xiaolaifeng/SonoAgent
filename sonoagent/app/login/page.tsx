"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// 演示用预填:仅当设置了 NEXT_PUBLIC_DEMO_* 时生效;生产请留空,避免凭据进入前端 bundle
const DEMO_USER = process.env.NEXT_PUBLIC_DEMO_USERNAME ?? "";
const DEMO_PASS = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";

export default function LoginPage() {
  const [u, setU] = useState(DEMO_USER); const [p, setP] = useState(DEMO_PASS); const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${BP}/api/auth`, {
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
