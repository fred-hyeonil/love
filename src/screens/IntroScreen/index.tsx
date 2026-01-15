import { ActionButton } from "@/components/ActionButton";
import { siteConfig } from "@/config/site";

export function IntroScreen() {
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  return (
    // fixed inset-0와 z-index로 화면 전체를 완전히 덮고 스크롤/드래그 차단
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none">
      {/* 핑크색 구역(배경)을 빈틈없이 채우는 이모티콘 파티 */}
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-6 p-10 opacity-50 pointer-events-none">
        {Array.from({ length: 240 }).map((_, i) => (
          <span 
            key={i} 
            className="animate-pulse text-3xl sm:text-4xl" 
            style={{ 
              animationDelay: `${(i * 0.05) % 2}s`,
              transform: `rotate(${(i * 30) % 360}deg)` 
            }}
          >
            {introEmojis[i % introEmojis.length]}
          </span>
        ))}
      </div>

      {/* 중앙 하얀색 대형 액자 - 배경 위에 띄움 */}
      <div className="relative z-10 flex h-[82vh] w-[92%] items-center justify-center overflow-hidden rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-6 py-10 sm:w-[88%] lg:w-[82%]">
        <div className="relative flex min-h-[450px] w-full items-center justify-center text-center">
          {/* Phase One: 중앙 정렬, 액자 안을 벗어나지 않도록 크기 조절 */}
          <p className="intro-phase intro-phase-one absolute whitespace-nowrap px-4 text-4xl font-extrabold tracking-tighter text-rose-500 sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            {siteConfig.intro.phaseOneText}
          </p>

          {/* Phase Two: 동일한 중앙 위치 */}
          <div className="intro-phase intro-phase-two absolute flex w-full flex-col items-center gap-14 px-4">
            <div className="space-y-8 whitespace-nowrap text-2xl font-extrabold text-rose-500 sm:text-4xl md:text-6xl lg:text-7xl">
              <p className="tracking-tight">{siteConfig.intro.phaseTwoLine1}</p>
              <p className="text-rose-600">
                <span className="font-black">{siteConfig.intro.phaseTwoLine2}</span>
              </p>
            </div>
            <div className="mt-6 scale-[2.8] transition-all hover:scale-[3.0] active:scale-[2.6]">
              <ActionButton label={siteConfig.intro.cta} href="/login" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
