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
