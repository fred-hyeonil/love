"use client";

import { siteConfig } from "@/config/site";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";


export function SignupScreen() {
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];
  const router = useRouter();

  const initialValues = useMemo(() => {
    const v: Record<string, string> = {};
    for (const f of siteConfig.signup.fields) {
      v[f.id] = "";
    }
    return v;
  }, []);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const onChange = (id: string, next: string) => {
    if (id === "birthdate") {
      // 숫자만 추출
      const digits = next.replace(/\D/g, "");
      
      // 최대 8자리 제한 (YYYYMMDD)
      const limited = digits.slice(0, 8);
      
      let year = limited.slice(0, 4);
      let month = limited.slice(4, 6);
      let day = limited.slice(6, 8);

      // 월 제한 (01~12)
      if (month.length === 2) {
        const m = parseInt(month);
        if (m > 12) month = "12";
        if (m === 0) month = "01";
      } else if (month.length === 1) {
        // 첫 글자가 2~9이면 자동으로 앞에 0을 붙임 (예: 2 -> 02)
        if (parseInt(month) > 1) month = "0" + month;
      }

      // 일 제한 (01~31)
      if (day.length === 2) {
        const d = parseInt(day);
        if (d > 31) day = "31";
        if (d === 0) day = "01";
      } else if (day.length === 1) {
        // 첫 글자가 4~9이면 자동으로 앞에 0을 붙임 (예: 4 -> 04)
        if (parseInt(day) > 3) day = "0" + day;
      }
      
      // 포맷팅 (YYYY.MM.DD)
      let formatted = year;
      if (month) formatted += "." + month;
      if (day) formatted += "." + day;
      
      setValues((prev) => ({ ...prev, [id]: formatted }));
      return;
    }
    setValues((prev) => ({ ...prev, [id]: next }));
  };

const onSignup = async () => {

  setError(null);
  setSuccess(null);

const userId = (values.id ?? "").trim();
const password = (values.password ?? "").trim();
const passwordConfirm = (values.passwordConfirm ?? "").trim();
const name = (values.nickname ?? "").trim();
const birthDateRaw = (values.birthdate ?? "").trim();

  if (!userId || !password || !passwordConfirm || !name || !birthDateRaw) {
    setError("모든 항목을 입력해주세요.");
    return;
  }

  if (password !== passwordConfirm) {
    setError("비밀번호 확인이 일치하지 않습니다.");
    return;
  }

  // "2003.11.30" -> "2003-11-30" 변환
  const birthDate = birthDateRaw.replace(/\./g, "-");

  try {
    setSubmitting(true);

    await apiFetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password, name, birthDate }),
    });

    localStorage.setItem("userName", name);
    setSuccess("회원가입 성공! 로그인 페이지로 이동합니다.");
    router.push("/login");
  } catch (e: any) {
  if (e?.name === "ApiError") {
    if (e.status === 401) {
      setError("이미 존재하는 아이디입니다.");
      return;
    }
  }
  setError(e?.message ?? "회원가입에 실패했습니다.");
} finally {
  setSubmitting(false);
}
};

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

      {/* 중앙 대형 핑크 액자 */}
      <div className="relative z-10 flex h-[92vh] w-[94%] flex-col items-center justify-center rounded-[40px] sm:rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-4 py-8 sm:px-10 sm:py-10 sm:w-[85%] lg:w-[75%]">
        <div className="w-full max-w-4xl text-center overflow-y-auto scrollbar-hide">
          <h2 className="mb-4 sm:mb-8 text-4xl sm:text-6xl font-black tracking-tighter text-rose-500">
            {siteConfig.signup.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-3 sm:gap-y-4 text-left">
            {siteConfig.signup.fields.map((field) => (
              <div key={field.id} className="relative group">
                <p className="ml-4 sm:ml-6 mb-1 text-base sm:text-lg font-bold text-rose-400">{field.label}</p>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ""}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className="w-full rounded-[20px] sm:rounded-[25px] border-[3px] sm:border-4 border-rose-100 bg-rose-50/30 px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl font-bold text-rose-600 placeholder:text-rose-300 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 sm:ring-8 focus:ring-rose-100/50"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-10 w-full max-w-md mx-auto">
            <button
              onClick={onSignup}
              disabled={submitting}
              className="w-full rounded-full bg-rose-500 py-4 sm:py-6 text-2xl sm:text-3xl font-black text-white shadow-[0_15px_30px_rgba(244,114,182,0.4)] transition-all hover:scale-105 hover:bg-rose-600 active:scale-95 disabled:opacity-60"
            >
              {submitting ? "처리 중..." : siteConfig.signup.cta}
            </button>
            
            {error && <p className="mt-4 text-base sm:text-lg font-bold text-red-500">{error}</p>}
            {success && <p className="mt-4 text-base sm:text-lg font-bold text-green-500">{success}</p>}

            <p className="mt-4 sm:mt-6 text-lg sm:text-xl font-bold text-rose-300">
              이미 회원이신가요? <a href="/login" className="text-rose-500 underline underline-offset-4 hover:text-rose-700">로그인하기</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}