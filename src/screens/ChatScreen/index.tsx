"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { apiFetch } from "@/lib/api";

// v2 - updated chat logic
export function ChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [userArchetype, setUserArchetype] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("사용자");
  const [messages, setMessages] = useState<{id: string, speaker: "나" | "상대방", time: string, text: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  useEffect(() => {
    const savedResult = localStorage.getItem("surveyResult");
    const savedName = localStorage.getItem("userName");
    setUserArchetype(savedResult);
    if (savedName) setUserName(savedName);

    // 랜덤 첫 대화 설정
    const initialPrompts = [
      "오빠 오늘 뭐 했어?",
      "자기야 왜 이렇게 연락이 안 돼 ?",
      "오빠 나 지금 오빠한테 엄청 서운해"
    ];
    const randomPrompt = initialPrompts[Math.floor(Math.random() * initialPrompts.length)];
    
    setMessages([{
      id: "m1",
      speaker: "상대방" as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: randomPrompt
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const handleEndChat = () => {
    setIsFeedbackMode(true);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: `m${messages.length + 1}`,
      speaker: "나" as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: inputValue,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // 공통 apiFetch를 사용하여 설정된 BASE 주소로 요청을 보냅니다.
      const data = await apiFetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.speaker === "나" ? "user" : "assistant",
            content: m.text
          })),
          userArchetype,
          userName,
          character: siteConfig.chat.character.name
        }),
      });
      
      const aiMessage = {
        id: `m${updatedMessages.length + 1}`,
        speaker: "상대방" as const,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        text: data.reply || data.message || "미안해, 잠시 딴생각을 했어. 다시 말해줄래?",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSendMessage();
    }
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
      <div className="relative z-10 flex h-[92vh] w-[96%] overflow-hidden rounded-[30px] sm:rounded-[50px] bg-white shadow-[0_0_120px_rgba(255,182,193,0.4)] border-[6px] sm:border-[12px] border-rose-100/20 lg:w-[90%] xl:w-[85%]">
        
        {/* 사이드바: My Page */}
        <aside className="hidden w-[260px] flex-col bg-rose-50/15 p-6 lg:p-10 lg:flex border-r-2 border-rose-100/30">
          <div className="mb-6 lg:mb-10">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tighter text-rose-500 italic">My Page</h2>
            <div className="mt-2 h-1 w-12 bg-rose-200 rounded-full" />
          </div>
          
          <nav className="flex-1 space-y-3 lg:space-y-4 overflow-y-auto scrollbar-hide">
            {siteConfig.chat.sidebar.items.map((item) => (
              <button 
                key={item} 
                className={`w-full group flex items-center gap-3 lg:gap-4 rounded-[15px] lg:rounded-[20px] border-2 p-3 lg:p-4 transition-all shadow-sm ${
                  isFeedbackMode && item === "연애 report" 
                    ? "bg-rose-500 border-rose-400 text-white shadow-rose-200" 
                    : "bg-white/60 border-transparent text-rose-600/80 hover:border-rose-300 hover:bg-white"
                }`}
              >
                <span className="text-base lg:text-lg font-bold tracking-tight whitespace-nowrap">{item}</span>
              </button>
            ))}
            
            <button 
              onClick={() => {
                localStorage.removeItem("surveyResult");
                router.push("/survey");
              }}
              className="w-full group flex items-center gap-3 lg:gap-4 rounded-[15px] lg:rounded-[20px] border-2 p-3 lg:p-4 transition-all shadow-sm bg-white/60 border-transparent text-rose-600/80 hover:border-rose-300 hover:bg-white"
            >
              <span className="text-base lg:text-lg font-bold tracking-tight whitespace-nowrap">성격 테스트 다시 하기</span>
            </button>
          </nav>

          <button 
            onClick={handleEndChat}
            className="mt-6 lg:mt-10 rounded-[15px] lg:rounded-[20px] bg-rose-500 py-4 lg:py-5 text-lg lg:text-xl font-black text-white shadow-[0_10px_20px_rgba(244,114,182,0.3)] transition-all hover:bg-rose-600 active:scale-95 border-2 border-rose-400"
          >
            대화 종료
          </button>
        </aside>

        {/* 메인 영역 */}
        <main className="flex flex-1 flex-col bg-white/40 backdrop-blur-sm min-w-0">
          {!isFeedbackMode ? (
            <>
              {/* 상단바: 캐릭터 정보 */}
              <header className="flex items-center justify-between px-6 py-4 lg:px-12 lg:py-8 border-b-2 border-rose-50/50 bg-white/80">
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="relative">
                    <div className="flex h-12 w-12 lg:h-20 lg:w-20 items-center justify-center rounded-[15px] lg:rounded-[25px] bg-rose-50 text-2xl lg:text-4xl shadow-inner border-2 border-rose-100">
                      {siteConfig.chat.character.emoji}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 lg:h-6 lg:w-6 rounded-full bg-green-400 border-2 lg:border-4 border-white shadow-sm" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl lg:text-3xl font-black text-rose-600 tracking-tight truncate">{siteConfig.chat.character.name}</h3>
                    <p className="text-[10px] lg:text-xs font-black text-rose-400 uppercase tracking-widest mt-0.5">Dating Solution</p>
                  </div>
                </div>
                
                {userArchetype && (
                  <div className="flex items-center gap-2 lg:gap-3 rounded-full bg-rose-50 px-4 py-2 lg:px-6 lg:py-3 border-2 border-rose-100 shadow-sm max-w-[150px] lg:max-w-none">
                    <div className="h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-rose-400 animate-pulse flex-shrink-0" />
                    <span className="text-rose-600 text-[10px] lg:text-sm font-black tracking-tight truncate">
                      {userArchetype}
                    </span>
                  </div>
                )}
              </header>

              {/* 채팅 메시지 리스트 */}
              <div 
                ref={scrollRef}
                className="flex-1 space-y-8 lg:space-y-12 overflow-y-auto p-6 lg:p-14 scrollbar-hide"
              >
                <div className="text-center mb-8 lg:mb-14">
                  <span className="bg-rose-100/50 text-rose-400 text-[10px] lg:text-xs font-black px-4 py-2 lg:px-6 lg:py-2.5 rounded-full uppercase tracking-[0.1em] lg:tracking-[0.2em] border border-rose-100/50 shadow-sm">
                    설문 결과를 바탕으로 대화합니다
                  </span>
                </div>
                {messages.map((message) => {
                  const isMe = message.speaker === "나";
                  return (
                    <div key={message.id} className={`flex items-start gap-3 lg:gap-5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="flex h-10 w-10 lg:h-14 lg:w-14 flex-shrink-0 items-center justify-center rounded-[12px] lg:rounded-[20px] bg-white border-2 border-rose-100 text-xl lg:text-2xl shadow-sm transition-transform hover:scale-110">
                        {isMe ? "👤" : siteConfig.chat.character.emoji}
                      </div>
                      <div className={`relative flex flex-col gap-1 lg:gap-2 max-w-[85%] lg:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-0.5 px-2">
                          <span className="text-[10px] lg:text-sm font-black text-rose-400 uppercase tracking-tighter">
                            {isMe ? (userName === "사용자" ? "나" : userName) : siteConfig.chat.character.name}
                          </span>
                        </div>
                        <div className={`relative px-5 py-3 lg:px-8 lg:py-5 rounded-[22px] lg:rounded-[32px] shadow-sm transition-all border-2 ${
                          isMe 
                            ? "bg-rose-500 text-white border-rose-400" 
                            : "bg-white text-rose-700 border-rose-100"
                        }`}>
                          <p className="text-base lg:text-xl font-bold leading-relaxed break-keep">
                            {message.text}
                          </p>
                        </div>
                        <span className="text-[9px] lg:text-[11px] font-black text-rose-200 px-2 uppercase tracking-tighter">{message.time}</span>
                      </div>
                    </div>
                  );
                })}
                
                {isLoading && (
                  <div className="flex items-start gap-3 lg:gap-5 flex-row">
                    <div className="flex h-10 w-10 lg:h-14 lg:w-14 flex-shrink-0 items-center justify-center rounded-[12px] lg:rounded-[20px] bg-white border-2 border-rose-100 text-xl lg:text-2xl shadow-sm animate-bounce">
                      {siteConfig.chat.character.emoji}
                    </div>
                    <div className="relative flex flex-col gap-1 lg:gap-2 max-w-[85%] lg:max-w-[75%] items-start">
                      <div className="flex items-center gap-2 mb-0.5 px-2">
                        <span className="text-[10px] lg:text-sm font-black text-rose-400 uppercase tracking-tighter">
                          {siteConfig.chat.character.name}
                        </span>
                      </div>
                      <div className="relative px-5 py-3 lg:px-8 lg:py-5 rounded-[22px] lg:rounded-[32px] shadow-sm bg-white text-rose-300 border-2 border-rose-100">
                        <div className="flex gap-1">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce [animation-delay:0.2s]">.</span>
                          <span className="animate-bounce [animation-delay:0.4s]">.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 입력 & 퀵 리플라이 */}
              <footer className="p-6 lg:p-10 bg-white/60 backdrop-blur-md border-t-2 border-rose-50/50">
                <div className="mb-4 lg:mb-8 flex flex-wrap gap-2 lg:gap-3 justify-center max-h-[100px] lg:max-h-none overflow-y-auto lg:overflow-visible">
                  {siteConfig.chat.quickReplies.map((reply) => (
                    <button 
                      key={reply}
                      onClick={() => {
                        setInputValue(reply);
                      }}
                      className="rounded-full border-2 border-rose-200 bg-white px-4 py-1.5 lg:px-6 lg:py-2.5 text-xs lg:text-base font-black text-rose-400 transition-all hover:border-rose-400 hover:text-rose-600 hover:scale-105 active:scale-95 shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <div className="relative max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 lg:gap-4 rounded-full border-[2px] lg:border-[3px] border-rose-100 bg-white p-1.5 lg:p-2 pl-6 lg:pl-10 shadow-xl focus-within:border-rose-400 transition-all">
                    <input 
                      type="text" 
                      placeholder={isLoading ? "답변을 기다리는 중..." : "고민을 입력하세요..."}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1 bg-transparent py-3 lg:py-5 text-base lg:text-xl font-bold text-rose-600 placeholder:text-rose-200 focus:outline-none disabled:opacity-50 min-w-0"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={isLoading}
                      className="rounded-full bg-rose-500 px-6 lg:px-10 py-3 lg:py-5 text-sm lg:text-lg font-black text-white shadow-lg hover:bg-rose-600 transition-all active:scale-95 border-2 border-rose-400 disabled:bg-rose-300 disabled:border-rose-200 whitespace-nowrap"
                    >
                      {isLoading ? "..." : "SEND ✨"}
                    </button>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            /* 피드백 리포트 화면 */
            <div className="flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto scrollbar-hide bg-white/60">
              <div className="text-center mb-8 lg:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-4xl lg:text-6xl font-black text-rose-500 tracking-tighter mb-4 italic drop-shadow-sm">Love Report</h3>
                <p className="text-rose-300 font-bold tracking-widest uppercase text-[10px] lg:text-sm">Your Personal Dating Feedback</p>
                <div className="mt-4 lg:mt-6 h-1.5 w-24 lg:w-32 bg-rose-200 mx-auto rounded-full" />
              </div>

              <div className="max-w-4xl mx-auto w-full space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-8 delay-300 duration-1000 fill-mode-both">
                <div className="rounded-[30px] lg:rounded-[45px] border-[6px] lg:border-8 border-rose-100 bg-white p-6 lg:p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 lg:p-8 opacity-10 text-6xl lg:text-8xl select-none pointer-events-none">📜</div>
                  <div className="flex items-center gap-4 lg:gap-8 mb-6 lg:mb-10">
                    <div className="flex h-14 w-14 lg:h-20 lg:w-20 items-center justify-center rounded-2xl lg:rounded-3xl bg-rose-50 text-3xl lg:text-5xl shadow-inner border-2 border-rose-100">
                      📊
                    </div>
                    <div>
                      <h4 className="text-xl lg:text-3xl font-black text-rose-600 tracking-tight">당신의 연애 성향 분석</h4>
                      <p className="text-rose-400 font-bold text-sm lg:text-lg mt-0.5 lg:mt-1">대화와 설문 데이터를 기반으로 도출된 결과입니다.</p>
                    </div>
                  </div>
                  <div className="space-y-4 lg:space-y-6 relative z-10">
                    <div className="bg-rose-50/50 p-6 lg:p-8 rounded-[25px] lg:rounded-[35px] border-4 border-rose-100/50 shadow-inner">
                      <p className="text-lg lg:text-2xl font-bold text-rose-700 leading-[1.6] break-keep">
                        "당신은 상대방의 배려를 중요하게 생각하면서도, 자신의 감정을 표현하는 데에 조심스러운 편이시네요. 
                        선택하신 <span className="text-rose-500 font-black underline underline-offset-4">{siteConfig.chat.character.name}</span>와의 대화 패턴을 분석해보면, 
                        조금 더 솔직한 의사표현이 관계의 온도를 높이는 열쇠가 될 것입니다."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {[
                    { emoji: "👑", label: "진지하게 상담받기", sub: "1:1 프리미엄 케어" },
                    { emoji: "📱", label: "카톡 내용 평가받기", sub: "대화 캡처 분석" },
                    { emoji: "🔄", label: "채팅 다시 하기", sub: "캐릭터와 계속 대화", onClick: () => setIsFeedbackMode(false) }
                  ].map((btn, idx) => (
                    <button 
                      key={idx}
                      onClick={btn.onClick}
                      className="group relative flex flex-col items-center justify-center rounded-[30px] lg:rounded-[40px] border-[6px] lg:border-8 border-rose-100 bg-white p-6 lg:p-8 transition-all hover:scale-[1.03] active:scale-95 shadow-xl hover:border-rose-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-rose-50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="text-4xl lg:text-5xl mb-3 lg:mb-4 group-hover:animate-bounce relative z-10">{btn.emoji}</span>
                      <span className="text-lg lg:text-2xl font-black text-rose-600 relative z-10 tracking-tighter">{btn.label}</span>
                      <span className="text-[10px] lg:text-sm font-bold text-rose-300 mt-1 lg:mt-2 relative z-10">{btn.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
