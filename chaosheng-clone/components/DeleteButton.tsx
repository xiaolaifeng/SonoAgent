"use client";
import { useRouter } from "next/navigation";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="text-red-500"
      onClick={async () => {
        if (!confirm("确认删除该报告？")) return;
        await fetch(`${BP}/api/reports/${id}`, { method: "DELETE" });
        router.refresh();
      }}>
      删除
    </button>
  );
}
