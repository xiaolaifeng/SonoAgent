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
