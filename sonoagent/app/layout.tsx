import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "AI语音超声报告生成工作台",
  description: "超声智能体",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">{children}</main>
        <footer className="border-t py-4 text-center text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          © 2026 超声智能体
        </footer>
      </body>
    </html>
  );
}
