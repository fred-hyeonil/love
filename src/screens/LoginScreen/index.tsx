"use client";

import { ActionButton } from "@/components/ActionButton";
import { siteConfig } from "@/config/site";

export function LoginScreen() {
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];
  
  const primaryAction = siteConfig.login.actions.find(
    (action) => action.variant === "primary"
  );
  const secondaryActions = siteConfig.login.actions.filter(
    (action) => action.variant !== "primary"
  );

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
      <div className="relative z-10 flex h-[85vh] w-[94%] flex-col items-center justify-center rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-10 py-12 sm:w-[85%] lg:w-[70%]">
        <div className="w-full max-w-2xl text-center">
          <h2 className="mb-12 text-6xl font-black tracking-tighter text-rose-500 sm:text-7xl">
            {siteConfig.login.title}
          </h2>
          
          <div className="space-y-8">
            {siteConfig.login.fields.map((field, index) => (
              <div key={field.id} className="relative group">
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full rounded-[30px] border-4 border-rose-100 bg-rose-50/30 px-10 py-6 text-2xl font-bold text-rose-600 placeholder:text-rose-300 transition-all focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-8 focus:ring-rose-100/50"
                />
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-8">
            {primaryAction && (
              <ActionButton 
                label={primaryAction.label} 
                href="/ideal" 
                full 
              />
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
