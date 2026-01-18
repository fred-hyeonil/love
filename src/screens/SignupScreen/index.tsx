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
    <section className="fixed inset-0 flex items-center justify-center bg-rose-50">
      <div className="bg-white p-10 rounded-3xl w-full max-w-xl">
        <h2 className="text-3xl font-black text-rose-500 mb-8 text-center">
          {siteConfig.signup.title}
        </h2>

        <div className="space-y-4">
          {siteConfig.signup.fields.map((field) => (
            <input
              key={field.id}
              type={field.id === "birthdate" ? "date" : field.type}
              placeholder={field.placeholder}
              value={values[field.id] ?? ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full border-2 rounded-xl p-3"
            />
          ))}
        </div>

        <button
          onClick={onSignup}
          disabled={submitting}
          className="mt-6 w-full bg-rose-500 text-white py-3 rounded-xl font-bold"
        >
          {submitting ? "처리중..." : siteConfig.signup.cta}
        </button>

        {error && <p className="mt-4 text-red-500 font-bold">{error}</p>}
      </div>
    </section>
  );
}