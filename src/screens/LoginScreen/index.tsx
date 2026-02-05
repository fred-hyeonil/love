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

  /**
   * 로그인 요청 처리
   */
  const onLogin = async () => {
    setError(null);

    const userId = (values.userId ?? values.id ?? "").trim();
    const password = (values.password ?? "").trim();

    if (!userId || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      // 백엔드 로그인 API 호출
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      // 1. JWT 토큰 저장 (accessToken 또는 token 키값 유연하게 처리)
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      } else if (data.token) {
        localStorage.setItem("accessToken", data.token);
      } else {
        throw new Error("로그인 응답에 토큰이 없습니다.");
      }

      // 2. 사용자 이름 저장
      if (data.user?.name) {
        localStorage.setItem("userName", data.user.name);
      } else if (data.name) {
        localStorage.setItem("userName", data.name);
      }

      // 3. 설문 결과 유무에 따른 페이지 이동
      const savedResult = localStorage.getItem("surveyResult");
      if (savedResult) {
        router.push("/chat"); // 이미 설문을 했다면 채팅방으로
      } else {
        router.push("/ideal"); // 설문 전이라면 이상형 선택/설문으로
      }
    } catch (e: any) {  
      // 401 에러(아이디/비번 불일치) 처리
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
      <div className="relative z-10 flex h-[90dvh] sm:h-[85dvh] w-[94%] flex-col items-center justify-center rounded-[40px] sm:rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-6 py-10 sm:px-10 sm:py-12 sm:w-[85%] lg:w-[70%] xl:w-[60%]">
        <div className="w-full max-w-2xl text-center overflow-y-auto scrollbar-hide">
          <h2 className="mb-6 sm:mb-12 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-rose-500">
            {siteConfig.login.title}
          </h2>

          <div className="space-y-4 sm:space-y-8">
            {siteConfig.login.fields.map((field) => (
              <input
                key={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-full rounded-[20px] sm:rounded-[30px] border-[3px] sm:border-4 border-rose-100 bg-rose-50/30 px-6 py-4 sm:px-10 sm:py-6 text-lg sm:text-2xl font-bold text-rose-600 placeholder:text-rose-300 transition-all focus:border-rose-400 focus:bg-white focus:outline-none"
              />
            ))}
          </div>

          {error && (
            <p className="mt-4 sm:mt-6 text-base sm:text-lg font-bold text-red-500">{error}</p>
          )}

          <div className="mt-8 sm:mt-16 flex flex-col gap-4 sm:gap-8">
            {primaryAction && (
              <button
                onClick={onLogin}
                disabled={submitting}
                className="w-full rounded-[20px] sm:rounded-[30px] bg-rose-500 px-6 py-4 sm:px-10 sm:py-6 text-xl sm:text-2xl font-black text-white shadow-lg transition-all hover:bg-rose-600 active:scale-95 disabled:opacity-60"
              >
                {submitting ? "로그인 중..." : primaryAction.label}
              </button>
            )}

            <div className="flex items-center justify-center gap-4 sm:gap-10">
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