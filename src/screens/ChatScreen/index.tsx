"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { apiFetch } from "@/lib/api";

/**
 * 채팅 화면 (ChatScreen)
 * AI 캐릭터와의 실시간 대화 및 사용자 감정 분석 리포트를 제공하는 메인 화면입니다.
 * 1. 실시간 채팅: GPT API 연동을 통한 대화 처리
 * 2. 리포트 연동: BERT 감정 분석 기반 실시간 결과 시각화
 * 3. 마이페이지: 이상형 변경, 설문 재참여 등 독립 기능 제공
 */
export function ChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userArchetype, setUserArchetype] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("사용자");
  const [character, setCharacter] = useState({
    name: siteConfig.chat.character.name,
    emoji: siteConfig.chat.character.emoji
  });
  const [messages, setMessages] = useState<{id: string, speaker: "나" | "상대방", time: string, text: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  // 컴포넌트 마운트 시 초기 데이터 설정
  useEffect(() => {
    // 1. 인증 체크
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // 2. 사용자 정보 및 선택한 이상형 정보 로드
    const savedResult = localStorage.getItem("surveyResult");
    const savedName = localStorage.getItem("userName");
    const savedIdeal = localStorage.getItem("selectedIdeal");

    setUserArchetype(savedResult);
    if (savedName) setUserName(savedName);
    if (savedIdeal) {
      try {
        const parsed = JSON.parse(savedIdeal);
        if (parsed.name && parsed.emoji) {
          setCharacter(parsed);
        }
      } catch (e) {
        console.error("Ideal parse error:", e);
      }
    }

    // 3. 랜덤 첫 대화 설정 (상대방의 인사말)
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

  // 메시지 목록이나 로딩 상태가 변경될 때마다 하단으로 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    // 리포트 페이지에서 분석할 수 있도록 현재 대화 내용 저장
    if (messages.length > 0) {
      localStorage.setItem("currentChatUtterances", JSON.stringify(messages.map(m => ({
        role: m.speaker === "나" ? "user" : "assistant",
        text: m.text
      }))));
    }
  }, [messages, isLoading]);

  /**
   * 대화 종료 처리: 리포트 페이지로 이동
   */
  const handleEndChat = () => {
    router.push("/report");
  };

  /**
   * 일반 메시지 전송 및 AI 응답 수신
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // 사용자 메시지 추가
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
      // 백엔드 API 호출 (대화 목록, 성향, 캐릭터 정보 전송)
      const data = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.speaker === "나" ? "user" : "assistant",
            content: m.text
          })),
          userArchetype,
          userName,
          character: character.name
        }),
      });
      
      // AI 응답 메시지 추가
      const aiMessage = {
        id: `m${updatedMessages.length + 1}`,
        speaker: "상대방" as const,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        text: data.reply || data.message || "미안해, 잠시 딴생각을 했어. 다시 말해줄래?",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      // 세션 만료 처리
      if (error?.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 특수 요청 처리 (버튼 클릭 시 상황에 맞는 프롬프트 자동 생성)
   */
  const handleSpecialRequest = async (requestType: string) => {
    if (isLoading) return;
    
    let prompt = "";
    switch(requestType) {
      case "문장 추천해줘":
        prompt = "지금 이 대화 흐름에서 내가 보낼만한 센스 있는 답변 3가지만 추천해줘.";
        break;
      case "다른 해결책 알려줘":
        prompt = "이 상황을 해결할 수 있는 다른 연애 솔루션을 제안해줘.";
        break;
      case "감정 정리 도와줘":
        prompt = "지금 상대방의 심리와 나의 감정 상태를 분석해서 정리해줘.";
        break;
      default:
        prompt = requestType;
    }

    const userMessage = {
      id: `m${messages.length + 1}`,
      speaker: "나" as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      text: prompt,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const data = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.speaker === "나" ? "user" : "assistant",
            content: m.text
          })),
          userArchetype,
          userName,
          character: character.name,
          requestType
        }),
      });
      
      const aiMessage = {
        id: `m${updatedMessages.length + 1}`,
        speaker: "상대방" as const,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        text: data.reply || data.message || "미안해, 잠시 분석에 문제가 생겼어.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Special Request Error:", error);
      if (error?.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
      }
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
      <div className="relative z-10 flex h-[92dvh] w-[96%] overflow-hidden rounded-[30px] sm:rounded-[50px] bg-white shadow-[0_0_120px_rgba(255,182,193,0.4)] border-[6px] sm:border-[12px] border-rose-100/20 lg:w-[90%] xl:w-[85%]">
        
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
                onClick={() => {
                  if (item === "연애 report") {
                    router.push("/report");
                  } else if (item === "진지하게 상담받기") {
                    router.push("/counseling");
                  } else if (item === "카톡 내용 평가받기") {
                    router.push("/evaluation");
                  } else if (item === "나를 위한 소개팅 추천") {
                    router.push("/recommendation");
                  } else {
                    handleSpecialRequest(item);
                  }
                }}
                className={`w-full group flex items-center gap-3 lg:gap-4 rounded-[15px] lg:rounded-[20px] border-2 p-3 lg:p-4 transition-all shadow-sm bg-white/60 border-transparent text-rose-600/80 hover:border-rose-300 hover:bg-white`}
              >
                <span className="text-base lg:text-lg font-bold tracking-tight whitespace-nowrap">{item}</span>
              </button>
            ))}
            
            <button 
              onClick={() => {
                router.push("/ideal");
              }}
              className="w-full group flex items-center gap-3 lg:gap-4 rounded-[15px] lg:rounded-[20px] border-2 p-3 lg:p-4 transition-all shadow-sm bg-white/60 border-transparent text-rose-600/80 hover:border-rose-300 hover:bg-white"
            >
              <span className="text-base lg:text-lg font-bold tracking-tight whitespace-nowrap">내 여자친구 고르기</span>
            </button>

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
          {/* 상단바: 캐릭터 정보 */}
          <header className="flex items-center justify-between px-6 py-4 lg:px-12 lg:py-8 border-b-2 border-rose-50/50 bg-white/80">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="relative">
                <div className="flex h-12 w-12 lg:h-20 lg:w-20 items-center justify-center rounded-[15px] lg:rounded-[25px] bg-rose-50 text-2xl lg:text-4xl shadow-inner border-2 border-rose-100">
                  {character.emoji}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 lg:h-6 lg:w-6 rounded-full bg-green-400 border-2 lg:border-4 border-white shadow-sm" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl lg:text-3xl font-black text-rose-600 tracking-tight truncate">{character.name}</h3>
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
                    {isMe ? "👤" : character.emoji}
                  </div>
                  <div className={`relative flex flex-col gap-1 lg:gap-2 max-w-[85%] lg:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-0.5 px-2">
                      <span className="text-[10px] lg:text-sm font-black text-rose-400 uppercase tracking-tighter">
                        {isMe ? (userName === "사용자" ? "나" : userName) : character.name}
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
                  {character.emoji}
                </div>
                <div className="relative flex flex-col gap-1 lg:gap-2 max-w-[85%] lg:max-w-[75%] items-start">
                  <div className="flex items-center gap-2 mb-0.5 px-2">
                    <span className="text-[10px] lg:text-sm font-black text-rose-400 uppercase tracking-tighter">
                      {character.name}
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
                  onClick={() => handleSpecialRequest(reply)}
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
        </main>
      </div>
    </section>
  );
}
