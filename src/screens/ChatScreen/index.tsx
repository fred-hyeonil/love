"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export function ChatScreen() {
  const router = useRouter();
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  const handleEndChat = () => {
    setIsFeedbackMode(true);
  };

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none font-sans">
      {/* 핑크색 배경 이모티콘 파티 */}
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-30 pointer-events-none">
        {Array.from({ length: 150 }).map((_, i) => (
          <span 
            key={i} 
            className="text-2xl sm:text-3xl animate-pulse" 
            style={{ 
              animationDelay: `${(i * 0.1) % 2}s`,
              transform: `rotate(${(i * 45) % 360}deg)` 
            }}
          >
            {introEmojis[i % introEmojis.length]}
          </span>
        ))}
      </div>

      {/* 중앙 메인 프레임 */}
      <div className="relative z-10 flex h-[88vh] w-[94%] overflow-hidden rounded-[50px] bg-white shadow-[0_0_120px_rgba(255,182,193,0.4)] border-[12px] border-rose-100/20 lg:w-[85%]">
        
        {/* 사이드바: My Page */}
        <aside className="hidden w-[300px] flex-col bg-rose-50/15 p-10 lg:flex border-r-2 border-rose-100/30">
          <div className="mb-10">
            <h2 className="text-4xl font-black tracking-tighter text-rose-500 italic">My Page</h2>
            <div className="mt-2 h-1 w-12 bg-rose-200 rounded-full" />
          </div>
          
          <nav className="flex-1 space-y-4">
            {siteConfig.chat.sidebar.items.map((item) => (
              <button 
                key={item} 
                className={`w-full group flex items-center gap-4 rounded-[20px] border-2 p-4 transition-all shadow-sm ${
                  isFeedbackMode && item === "연애 report" 
                    ? "bg-rose-500 border-rose-400 text-white shadow-rose-200" 
                    : "bg-white/60 border-transparent text-rose-600/80 hover:border-rose-300 hover:bg-white"
                }`}
              >
                <span className="text-lg font-bold tracking-tight">{item}</span>
              </button>
            ))}
          </nav>

          <button 
            onClick={handleEndChat}
            className="mt-10 rounded-[20px] bg-rose-500 py-5 text-xl font-black text-white shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all hover:bg-rose-600 active:scale-95 border-2 border-rose-400"
          >
            대화 종료
          </button>
        </aside>

        {/* 메인 영역 */}
        <main className="flex flex-1 flex-col bg-white/40 backdrop-blur-sm">
          {!isFeedbackMode ? (
            <>
              {/* 상단바: 캐릭터 정보 */}
              <header className="flex items-center justify-between px-12 py-8 border-b-2 border-rose-50/50 bg-white/80">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[25px] bg-rose-50 text-4xl shadow-inner border-2 border-rose-100">
                      {siteConfig.chat.character.emoji}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-400 border-4 border-white shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-rose-600 tracking-tight">{siteConfig.chat.character.name}</h3>
                    <p className="text-xs font-black text-rose-400 uppercase tracking-widest mt-1">Dating Solution Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-rose-50 px-8 py-4 border-2 border-rose-100 shadow-sm">
                  <div className="h-3 w-3 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-rose-500 text-sm font-black uppercase">현재 대화 중...</span>
                </div>
              </header>

              {/* 채팅 메시지 리스트 */}
              <div className="flex-1 space-y-12 overflow-y-auto p-14 scrollbar-hide">
                <div className="text-center mb-14">
                  <span className="bg-rose-100/50 text-rose-400 text-xs font-black px-6 py-2.5 rounded-full uppercase tracking-[0.2em] border border-rose-100/50 shadow-sm">
                    선택한 캐릭터와 설문 결과를 바탕으로 대화합니다
                  </span>
                </div>
                {siteConfig.chat.messages.map((message) => {
                  const isMe = message.speaker === "나";
                  return (
                    <div key={message.id} className={`flex items-start gap-5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] bg-white border-2 border-rose-100 text-2xl shadow-sm transition-transform hover:scale-110">
                        {isMe ? "👤" : siteConfig.chat.character.emoji}
                      </div>
                      <div className={`relative flex flex-col gap-2 max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className="text-sm font-black text-rose-400 uppercase tracking-tighter">
                            {isMe ? "영광" : "동그라미"}
                          </span>
                        </div>
                        <div className={`relative px-8 py-5 rounded-[30px] shadow-sm transition-all border-2 ${
                          isMe 
                            ? "bg-rose-500 text-white border-rose-400 rounded-tr-none" 
                            : "bg-white text-rose-700 border-rose-100 rounded-tl-none"
                        }`}>
                          <p className="text-xl font-bold leading-relaxed break-keep">{message.text}</p>
                          <div className={`absolute top-0 w-4 h-4 ${isMe ? "-right-1.5 bg-rose-500" : "-left-1.5 bg-white border-l-2 border-t-2 border-rose-100"} transform rotate-45 -z-10`} />
                        </div>
                        <span className="text-[11px] font-black text-rose-200 px-2 uppercase tracking-tighter">{message.time} · Read</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 하단 입력 & 퀵 리플라이 */}
              <footer className="p-10 bg-white/60 backdrop-blur-md border-t-2 border-rose-50/50">
                <div className="mb-8 flex flex-wrap gap-3 justify-center">
                  {siteConfig.chat.quickReplies.map((reply) => (
                    <button 
                      key={reply}
                      className="rounded-full border-2 border-rose-200 bg-white px-6 py-2.5 text-base font-black text-rose-400 transition-all hover:border-rose-400 hover:text-rose-600 hover:scale-105 active:scale-95 shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <div className="relative max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 rounded-full border-[3px] border-rose-100 bg-white p-2 pl-10 shadow-xl focus-within:border-rose-400 transition-all">
                    <input 
                      type="text" 
                      placeholder="고민을 입력하세요..."
                      className="flex-1 bg-transparent py-5 text-xl font-bold text-rose-600 placeholder:text-rose-200 focus:outline-none"
                    />
                    <button className="rounded-full bg-rose-500 px-10 py-5 text-lg font-black text-white shadow-lg hover:bg-rose-600 transition-all active:scale-95 border-2 border-rose-400">
                      SEND ✨
                    </button>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            /* 피드백 리포트 화면 - 퀸의 감성 */
            <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide bg-white/60">
              <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-6xl font-black text-rose-500 tracking-tighter mb-4 italic drop-shadow-sm">Love Report</h3>
                <p className="text-rose-300 font-bold tracking-widest uppercase text-sm">Your Personal Dating Feedback</p>
                <div className="mt-6 h-1.5 w-32 bg-rose-200 mx-auto rounded-full" />
              </div>

              <div className="max-w-4xl mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 delay-300 duration-1000 fill-mode-both">
                <div className="rounded-[45px] border-8 border-rose-100 bg-white p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl select-none pointer-events-none">📜</div>
                  <div className="flex items-center gap-8 mb-10">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-5xl shadow-inner border-2 border-rose-100">
                      📊
                    </div>
                    <div>
                      <h4 className="text-3xl font-black text-rose-600 tracking-tight">당신의 연애 성향 분석</h4>
                      <p className="text-rose-400 font-bold text-lg mt-1">대화와 설문 데이터를 기반으로 도출된 결과입니다.</p>
                    </div>
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="bg-rose-50/50 p-8 rounded-[35px] border-4 border-rose-100/50 shadow-inner">
                      <p className="text-2xl font-bold text-rose-700 leading-[1.6] break-keep">
                        "당신은 상대방의 배려를 중요하게 생각하면서도, 자신의 감정을 표현하는 데에 조심스러운 편이시네요. 
                        선택하신 <span className="text-rose-500 font-black underline underline-offset-4">{siteConfig.chat.character.name}</span>와의 대화 패턴을 분석해보면, 
                        조금 더 솔직한 의사표현이 관계의 온도를 높이는 열쇠가 될 것입니다."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button 
                    className="group relative flex flex-col items-center justify-center rounded-[40px] border-8 border-rose-400 bg-rose-500 p-12 transition-all hover:scale-[1.03] active:scale-95 shadow-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="text-6xl mb-6 group-hover:animate-bounce relative z-10">👑</span>
                    <span className="text-3xl font-black text-white relative z-10 tracking-tighter">진지하게 상담받기</span>
                    <span className="text-base font-bold text-rose-100 mt-3 relative z-10">1:1 프리미엄 밀착 케어</span>
                  </button>
                  <button 
                    className="group relative flex flex-col items-center justify-center rounded-[40px] border-8 border-rose-100 bg-white p-12 transition-all hover:scale-[1.03] active:scale-95 shadow-xl hover:border-rose-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-rose-50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="text-6xl mb-6 group-hover:rotate-12 transition-transform relative z-10">📱</span>
                    <span className="text-3xl font-black text-rose-600 relative z-10 tracking-tighter">카톡 내용 평가받기</span>
                    <span className="text-base font-bold text-rose-300 mt-3 relative z-10">실제 대화 캡처 분석</span>
                  </button>
                </div>

                <div className="text-center pt-12 pb-6">
                  <button 
                    onClick={() => setIsFeedbackMode(false)}
                    className="text-rose-300 font-black text-xl hover:text-rose-500 transition-all hover:tracking-widest underline underline-offset-8"
                  >
                    BACK TO CHAT
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
