"use client";

import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export function SignupScreen() {
  const router = useRouter();
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none">
      {/* 배경 이모티콘 파티 */}
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-30 pointer-events-none">
        {Array.from({ length: 180 }).map((_, i) => (
          <span 
            key={i} 
            className="text-3xl sm:text-4xl" 
            style={{ 
              transform: `rotate(${(i * 30) % 360}deg)` 
            }}
          >
            {introEmojis[i % introEmojis.length]}
          </span>
        ))}
      </div>

      {/* 중앙 대형 핑크 액자 */}
      <div className="relative z-10 flex h-[92vh] w-[94%] flex-col items-center justify-center rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-10 py-10 sm:w-[85%] lg:w-[75%]">
        <div className="w-full max-w-4xl text-center">
          <h2 className="mb-10 text-5xl font-black tracking-tighter text-rose-500 sm:text-6xl">
            {siteConfig.signup.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-left">
            {siteConfig.signup.fields.map((field, index) => (
              <div key={field.id} className="relative group">
                <p className="ml-6 mb-2 text-lg font-bold text-rose-400">{field.label}</p>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const form = e.currentTarget.closest("section");
                      const inputs = Array.from(form?.querySelectorAll("input") || []);
                      const nextInput = inputs[index + 1] as HTMLInputElement;
                      if (nextInput) {
                        e.preventDefault();
                        nextInput.focus();
                      }
                    }
                  }}
                  className="w-full rounded-[25px] border-4 border-rose-100 bg-rose-50/30 px-8 py-4 text-xl font-bold text-rose-600 placeholder:text-rose-300 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-8 focus:ring-rose-100/50"
                />
              </div>
            ))}
          </div>

          <div className="mt-12">
            <button className="w-full rounded-full bg-rose-500 py-7 text-3xl font-black text-white shadow-[0_20px_40px_rgba(244,114,182,0.4)] transition-all hover:scale-105 hover:bg-rose-600 active:scale-95">
              {siteConfig.signup.cta}
            </button>
            
            <p className="mt-8 text-xl font-bold text-rose-300">
              이미 회원이신가요? <a href="/login" className="text-rose-500 underline underline-offset-4 hover:text-rose-700">로그인하기</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
