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
