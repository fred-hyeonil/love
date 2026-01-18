"use client";

import { useState } from "react";

export default function Page() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const ping = async () => {
    setError(null);
    setData(null);

    try {
      const res = await fetch("http://localhost:8080/actuator/health");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message ?? "unknown error");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={ping}
        className="rounded-xl px-4 py-2 bg-rose-500 text-white"
      >
        백엔드 연결 테스트
      </button>

      {error && <p className="text-red-600">에러: {error}</p>}

      <pre className="bg-white/70 p-4 rounded-xl">
        {data ? JSON.stringify(data, null, 2) : "아직 호출 안함"}
      </pre>
    </div>
  );
}
