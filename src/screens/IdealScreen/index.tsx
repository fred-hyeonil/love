"use client";

import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

/**
 * 이상형 선택 화면 (IdealScreen)
 * 대화하고 싶은 상대방(이상형)의 캐릭터를 선택하는 화면입니다.
 * 공주, 신, 인형 등 5가지 타입 중 하나를 선택하면 해당 정보가 저장됩니다.
 */
export function IdealScreen() {
  const router = useRouter();
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none">
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-30 pointer-events-none">
        {Array.from({ length: 180 }).map((_, i) => (
          <span key={i} className="text-3xl sm:text-4xl" style={{ transform: `rotate(${(i * 30) % 360}deg)` }}>
            {introEmojis[i % introEmojis.length]}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex h-[90dvh] w-[94%] flex-col items-center justify-center rounded-[40px] sm:rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-4 py-8 sm:px-6 sm:py-10 sm:w-[90%] lg:w-[85%]">
        <div className="w-full max-w-6xl text-center overflow-y-auto scrollbar-hide">
          <h2 className="mb-8 sm:mb-12 text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-rose-500 leading-tight">
            {siteConfig.ideal.title}
          </h2>
          
          {/* 캐릭터 선택 그리드 */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {siteConfig.ideal.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => {
                  // 선택한 캐릭터의 이름과 이모지를 저장하여 채팅방에서 활용
                  localStorage.setItem("selectedIdeal", JSON.stringify({
                    name: choice.label,
                    emoji: choice.emoji
                  }));
                  
                  // 무조건 채팅방으로 복귀 (독립적 처리)
                  router.push("/chat");
                }}
                className="group relative flex flex-col items-center justify-center rounded-[30px] sm:rounded-[40px] border-[3px] sm:border-4 border-rose-100 bg-rose-50/30 px-4 py-6 sm:py-8 transition-all hover:scale-[1.05] hover:border-rose-400 hover:bg-white hover:shadow-[0_20px_40px_rgba(244,114,182,0.2)] active:scale-95"
              >
                <span className="mb-2 sm:mb-4 text-5xl sm:text-6xl lg:text-7xl transition-transform group-hover:scale-110">
                  {choice.emoji}
                </span>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 truncate w-full">
                  {choice.label}
                </p>
                <div className="mt-2 sm:mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {choice.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-rose-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-sm font-bold text-rose-400 whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <p className="mt-8 sm:mt-16 text-lg sm:text-2xl font-bold text-rose-300 animate-bounce">
            가장 마음에 드는 타입을 선택해 보세요! ✨
          </p>
        </div>
      </div>
    </section>
  );
}
