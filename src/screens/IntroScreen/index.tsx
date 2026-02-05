import { ActionButton } from "@/components/ActionButton";
import { siteConfig } from "@/config/site";

/**
 * 인트로 화면 (IntroScreen)
 * 앱의 첫 인상을 결정하는 화면으로, 감성적인 애니메이션과
 * '사랑에 빠진 게 죄는 아니잖아'라는 강렬한 메시지를 단계적으로 노출합니다.
 */
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
      <div className="relative z-10 flex h-[85dvh] sm:h-[82dvh] w-[94%] sm:w-[92%] items-center justify-center overflow-hidden rounded-[40px] sm:rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-4 sm:px-6 py-10 sm:w-[88%] lg:w-[82%]">
        <div className="relative flex min-h-[400px] sm:min-h-[450px] w-full items-center justify-center text-center">
          {/* Phase One: 중앙 정렬, 액자 안을 벗어나지 않도록 크기 조절 */}
          <div className="intro-phase intro-phase-one absolute flex w-full flex-col items-center justify-center gap-6 sm:gap-10 px-4">
            <div className="w-full overflow-hidden">
              <p className="text-center text-[7vw] sm:text-[5.2vw] font-black tracking-tighter text-rose-500 sm:text-6xl md:text-7xl lg:text-8xl leading-tight sm:leading-none break-keep">
                {siteConfig.intro.phaseOneText}
              </p>
            </div>
            <div className="relative aspect-video w-[85%] sm:w-[80%] max-w-[280px] sm:max-w-[500px] md:max-w-[600px] overflow-hidden rounded-2xl shadow-2xl transition-all">
              <img 
                src="/images/lovenotcrime.png" 
                alt="사랑에 빠진 게 죄는 아니잖아" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Phase Two: 동일한 중앙 위치 */}
          <div className="intro-phase intro-phase-two absolute flex w-full flex-col items-center gap-8 sm:gap-16 px-4">
            <div className="space-y-4 sm:space-y-10 text-[9vw] sm:text-[8.5vw] font-extrabold text-rose-500 sm:text-5xl md:text-7xl lg:text-8xl leading-tight break-keep">
              <p className="tracking-tight">{siteConfig.intro.phaseTwoLine1}</p>
              <p className="text-rose-600">
                <span className="font-black">{siteConfig.intro.phaseTwoLine2}</span>
              </p>
            </div>
            <div className="mt-4 sm:mt-8 transition-all scale-100 sm:scale-125 hover:scale-110 sm:hover:scale-135">
              <ActionButton label={siteConfig.intro.cta} href="/login" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
