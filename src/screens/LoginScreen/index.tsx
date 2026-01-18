"use client";

import { ActionButton } from "@/components/ActionButton";
import { siteConfig } from "@/config/site";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function LoginScreen() {
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];
  const router = useRouter();

  const initialValues = useMemo(() => {
    const v: Record<string, string> = {};
    for (const f of siteConfig.login.fields) {
      v[f.id] = "";
    }
    return v;
  }, []);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (id: string, next: string) => {
    setValues((prev) => ({ ...prev, [id]: next }));
  };

  const onLogin = async () => {
    setError(null);

    const userId = (values.userId ?? values.id ?? "").trim();     // ✅ id도 허용
    const password = (values.password ?? "").trim();;

    console.log("login values:", values);
    console.log("login payload:", { userId, password });

    if (!userId || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      // JWT 저장
      localStorage.setItem("accessToken", data.accessToken);

      router.push("/ideal"); // 로그인 성공 후 이동
    } catch (e: any) {  
  if (e?.name === "ApiError" && e.status === 401) {
    setError("아이디/비밀번호를 다시 확인해주세요.");
    return;
  }
  setError(e?.message ?? "로그인에 실패했습니다.");
} finally {
  setSubmitting(false);
}

  };

  const primaryAction = siteConfig.login.actions.find(
    (action) => action.variant === "primary"
  );
  const secondaryActions = siteConfig.login.actions.filter(
    (action) => action.variant !== "primary"
  );

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none">
      {/* 배경 이모티콘 */}
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-30 pointer-events-none">
        {Array.from({ length: 180 }).map((_, i) => (
          <span key={i} className="text-3xl sm:text-4xl">
            {introEmojis[i % introEmojis.length]}
          </span>
        ))}
      </div>

      {/* 중앙 카드 */}
      <div className="relative z-10 flex h-[85vh] w-[94%] flex-col items-center justify-center rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-10 py-12 sm:w-[85%] lg:w-[70%]">
        <div className="w-full max-w-2xl text-center">
          <h2 className="mb-12 text-6xl font-black tracking-tighter text-rose-500 sm:text-7xl">
            {siteConfig.login.title}
          </h2>

          <div className="space-y-8">
            {siteConfig.login.fields.map((field) => (
              <input
                key={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-full rounded-[30px] border-4 border-rose-100 bg-rose-50/30 px-10 py-6 text-2xl font-bold text-rose-600 placeholder:text-rose-300 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-8 focus:ring-rose-100/50"
              />
            ))}
          </div>

          {error && (
            <p className="mt-6 text-lg font-bold text-red-500">{error}</p>
          )}

          <div className="mt-16 flex flex-col gap-8">
            {primaryAction && (
              <button
                onClick={onLogin}
                disabled={submitting}
                className="w-full rounded-[30px] bg-rose-500 px-10 py-6 text-2xl font-black text-white shadow-lg transition-all hover:bg-rose-600 disabled:opacity-60"
              >
                {submitting ? "로그인 중..." : primaryAction.label}
              </button>
            )}

            <div className="flex items-center justify-center gap-10">
              <ActionButton
                label={secondaryActions[0]?.label ?? "새로 가입"}
                variant="ghost"
                href="/signup"
              />
              <span className="h-2 w-2 rounded-full bg-rose-200" />
              <ActionButton
                label={secondaryActions[1]?.label ?? "Google Login"}
                variant="ghost"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}