"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function MePage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setErr(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("토큰 없음: 먼저 로그인 해줘");

        const me = await apiFetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(me);
      } catch (e: any) {
        setErr(e.message ?? "error");
      }
    };

    run();
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">Me</h1>
      {err && <p className="text-red-600">에러: {err}</p>}
      <pre className="bg-white/70 p-4 rounded">
        {data ? JSON.stringify(data, null, 2) : "로딩중..."}
      </pre>
    </div>
  );
}