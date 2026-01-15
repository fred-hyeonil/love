"use client";

import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export function IdealScreen() {
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
      <div className="relative z-10 flex h-[90vh] w-[94%] flex-col items-center justify-center rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-6 py-10 sm:w-[90%] lg:w-[85%]">
        <div className="w-full max-w-6xl text-center">
          <h2 className="mb-12 text-5xl font-black tracking-tighter text-rose-500 sm:text-7xl">
            {siteConfig.ideal.title}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {siteConfig.ideal.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => router.push("/survey")}
                className="group relative flex flex-col items-center justify-center rounded-[40px] border-4 border-rose-100 bg-rose-50/30 px-4 py-8 transition-all hover:scale-110 hover:border-rose-400 hover:bg-white hover:shadow-[0_20px_40px_rgba(244,114,182,0.2)] active:scale-95"
              >
                <span className="mb-4 text-6xl transition-transform group-hover:scale-125 sm:text-7xl">
                  {choice.emoji}
                </span>
                <p className="text-2xl font-black text-rose-600 sm:text-3xl">
                  {choice.label}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {choice.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <p className="mt-16 text-2xl font-bold text-rose-300 animate-bounce">
            가장 마음에 드는 타입을 선택해 보세요! ✨
          </p>
        </div>
      </div>
    </section>
  );
}
