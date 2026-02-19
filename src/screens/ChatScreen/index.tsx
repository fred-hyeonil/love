"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";
import {
  ApiError,
  createConversation,
  getConversationMessages,
  getConversations,
  getSession,
  getStoredSession,
  sendConversationMessage,
  type AddMessageResponse,
  type ConversationMessage,
  type ConversationListItem,
  type SessionConversationMessage,
} from "@/lib/api";

function mapApiMessageToUi(m: ConversationMessage | SessionConversationMessage): {
  id: string;
  speaker: "나" | "상대방";
  time: string;
  text: string;
} {
  const time = "createdAt" in m ? m.createdAt : "";
  const date = time ? new Date(time) : new Date();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return {
    id: String(m.id),
    speaker: String(m.role ?? "").toUpperCase() === "USER" ? "나" : "상대방",
    time: timeStr,
    text: m.content,
  };
}

/**
 * 채팅 화면 (ChatScreen)
 * AI 캐릭터와의 실시간 대화 및 사용자 감정 분석 리포트를 제공하는 메인 화면입니다.
 * 1. 실시간 채팅: GPT API 연동을 통한 대화 처리
 * 2. 리포트 연동: BERT 감정 분석 기반 실시간 결과 시각화
 * 3. 마이페이지: 이상형 변경, 설문 재참여 등 독립 기능 제공
 */
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 420;
const SIDEBAR_DEFAULT = 280;

export function ChatScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const listPopoverRef = useRef<HTMLDivElement>(null);
  const [userArchetype, setUserArchetype] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("사용자");
  const [character, setCharacter] = useState({
    name: siteConfig.chat.character.name,
    emoji: siteConfig.chat.character.emoji
  });
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversationList, setConversationList] = useState<ConversationListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [messages, setMessages] = useState<{id: string, speaker: "나" | "상대방", time: string, text: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  // My Page 사이드바 너비 드래그 조절
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const frame = frameRef.current;
      if (!frame) return;
      const { left } = frame.getBoundingClientRect();
      const next = Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX - left)));
      setSidebarWidth(next);
    };
    const onUp = () => setIsResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // 대화 목록 팝업: 바깥 클릭 시 닫기
  useEffect(() => {
    if (!isListOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const el = listPopoverRef.current;
      if (el && !el.contains(e.target as Node)) setIsListOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isListOpen]);

  // 세션 + 대화 초기화: ?restore= 대화복원(보고서→채팅) / 그 외 GET /api/session, lastConversation 또는 새 대화
  // restore는 반드시 실제 URL에서 읽기 (useSearchParams는 클라이언트 이동 시 한 템포 늦게 반영돼 이전 대화가 뜨는 버그 방지)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // 보고서→채팅 복원: URL ?restore= 우선, 없으면 sessionStorage(클라이언트 이동 시 URL 지연 반영 대비)
    let restoreIdRaw: string | null = null;
    if (typeof window !== "undefined") {
      restoreIdRaw = new URLSearchParams(window.location.search).get("restore");
      if (!restoreIdRaw) restoreIdRaw = sessionStorage.getItem("chatRestoreId");
    } else {
      restoreIdRaw = searchParams.get("restore");
    }
    const restoreId = restoreIdRaw ? parseInt(restoreIdRaw, 10) : null;
    const shouldRestore = restoreId != null && Number.isFinite(restoreId) && restoreId > 0;

    let cancelled = false;

    (async () => {
      const session = getStoredSession() ?? (await getSession().catch(() => null));
      if (cancelled || !session) {
        setSessionReady(true);
        if (!shouldRestore) return;
      }

      setUserName(session?.user?.name ?? "사용자");
      setUserArchetype(session?.partnerType?.isSet ? session.partnerType?.value ?? null : null);

      const savedIdeal = localStorage.getItem("selectedIdeal");
      if (savedIdeal) {
        try {
          const parsed = JSON.parse(savedIdeal) as { name?: string; emoji?: string };
          if (parsed.name && parsed.emoji) setCharacter({ name: parsed.name, emoji: parsed.emoji });
        } catch {
          // ignore
        }
      }

      if (shouldRestore && restoreId != null) {
        const id = restoreId;
        setConversationId(id);
        try {
          const fullMessages = await getConversationMessages(id);
          if (!cancelled) setMessages(fullMessages.map(mapApiMessageToUi));
        } catch {
          if (!cancelled) setMessages([]);
        }
        if (!cancelled) {
          setSessionReady(true);
          setListLoading(true);
          getConversations()
            .then((list) => { if (!cancelled) setConversationList(list); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setListLoading(false); });
          if (typeof window !== "undefined") sessionStorage.removeItem("chatRestoreId");
          router.replace("/chat");
        }
        return;
      }

      if (!session) {
        setSessionReady(true);
        return;
      }

      if (session.lastConversation != null) {
        setConversationId(session.lastConversation.id);
        try {
          const fullMessages = await getConversationMessages(session.lastConversation.id);
          if (fullMessages.length > 0) {
            setMessages(fullMessages.map(mapApiMessageToUi));
          } else if (session.lastConversationMessages?.length) {
            setMessages(session.lastConversationMessages.map(mapApiMessageToUi));
          }
        } catch {
          if (session.lastConversationMessages?.length) {
            setMessages(session.lastConversationMessages.map(mapApiMessageToUi));
          }
        }
      } else {
        try {
          const personaKeyFromIdeal = (() => {
            try {
              const raw = localStorage.getItem("selectedIdeal");
              if (!raw) return null;
              const p = JSON.parse(raw) as { personaKey?: string };
              return p.personaKey ?? null;
            } catch {
              return null;
            }
          })();
          const personaKey = personaKeyFromIdeal ?? (session.partnerType?.isSet ? session.partnerType.value ?? null : null);
          const res = await createConversation({
            title: "새 대화",
            scenarioKey: null,
            personaKey: personaKey || null,
          });
          if (!cancelled) setConversationId(res.conversationId);
          const initialPrompts = [
            "오빠 오늘 뭐 했어?",
            "자기야 왜 이렇게 연락이 안 돼 ?",
            "오빠 나 지금 오빠한테 엄청 서운해",
          ];
          const randomPrompt = initialPrompts[Math.floor(Math.random() * initialPrompts.length)];
          if (!cancelled) {
            setMessages([{
              id: "m1",
              speaker: "상대방" as const,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
              text: randomPrompt,
            }]);
          }
        } catch {
          if (!cancelled) setConversationId(null);
        }
      }
      if (!cancelled) {
        setSessionReady(true);
        setListLoading(true);
        getConversations()
          .then((list) => { if (!cancelled) setConversationList(list); })
          .catch(() => {})
          .finally(() => { if (!cancelled) setListLoading(false); });
      }
    })();

    return () => { cancelled = true; };
  }, [router]);

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
   * 대화 종료 처리: conversationId 저장 후 리포트 페이지로 이동 (리포트 API 인증용)
   */
  const handleEndChat = () => {
    if (conversationId != null && typeof window !== "undefined") {
      localStorage.setItem("reportConversationId", String(conversationId));
    }
    router.push("/report");
  };

  /**
   * 일반 메시지 전송: POST 한 번으로 userMessage + assistantMessage 받아서 바로 반영 (폴링 없음).
   * 자바가 Python 호출 끝날 때까지 대기 후 AddMessageResponse 로 내려주는 구조.
   */
  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content || isLoading || conversationId == null) return;

    const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const userMessage = {
      id: clientMessageId,
      speaker: "나" as const,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      text: content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await sendConversationMessage(conversationId, {
        role: "USER",
        content,
        clientMessageId,
      });

      const isAddResponse = (r: typeof res): r is AddMessageResponse =>
        r != null && "assistantMessage" in r && (r as AddMessageResponse).assistantMessage?.content != null;
      if (isAddResponse(res)) {
        setMessages((prev) => [...prev, mapApiMessageToUi(res.assistantMessage)]);
        getConversations().then(setConversationList).catch(() => {});
      } else {
        setMessages((prev) => [...prev, {
          id: `m-${Date.now()}`,
          speaker: "상대방" as const,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
          text: "미안해, 잠시 딴생각을 했어. 다시 말해줄래?",
        }]);
      }
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 특수 요청: POST 한 번으로 assistantMessage 받아서 바로 반영 (폴링 없음).
   */
  const handleSpecialRequest = async (requestType: string) => {
    if (isLoading || conversationId == null) return;

    let prompt = "";
    switch (requestType) {
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

    const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const userMessage = {
      id: clientMessageId,
      speaker: "나" as const,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      text: prompt,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await sendConversationMessage(conversationId, {
        role: "USER",
        content: prompt,
        clientMessageId,
      });

      const isAddResponse = (r: typeof res): r is AddMessageResponse =>
        r != null && "assistantMessage" in r && (r as AddMessageResponse).assistantMessage?.content != null;
      if (isAddResponse(res)) {
        setMessages((prev) => [...prev, mapApiMessageToUi(res.assistantMessage)]);
        getConversations().then(setConversationList).catch(() => {});
      } else {
        setMessages((prev) => [...prev, {
          id: `m-${Date.now()}`,
          speaker: "상대방" as const,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
          text: "미안해, 잠시 분석에 문제가 생겼어.",
        }]);
      }
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }
      console.error("Special Request Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSendMessage();
    }
  };

  /** 새 대화 시작: POST /api/conversations (personaKey = 선택한 캐릭터 우선, 없으면 partner_type) */
  const handleNewConversation = async () => {
    if (isLoading) return;
    setListLoading(true);
    try {
      const personaKeyFromIdeal = (() => {
        try {
          const raw = localStorage.getItem("selectedIdeal");
          if (!raw) return null;
          const p = JSON.parse(raw) as { personaKey?: string };
          return p.personaKey ?? null;
        } catch {
          return null;
        }
      })();
      const session = getStoredSession();
      const personaKey = personaKeyFromIdeal ?? (session?.partnerType?.isSet ? session.partnerType?.value ?? null : null);
      const res = await createConversation({
        title: "새 대화",
        scenarioKey: null,
        personaKey: personaKey || null,
      });
      setConversationId(res.conversationId);
      const initialPrompts = [
        "오빠 오늘 뭐 했어?",
        "자기야 왜 이렇게 연락이 안 돼 ?",
        "오빠 나 지금 오빠한테 엄청 서운해",
      ];
      setMessages([{
        id: "m1",
        speaker: "상대방" as const,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        text: initialPrompts[Math.floor(Math.random() * initialPrompts.length)],
      }]);
      const list = await getConversations();
      setConversationList(list);
    } catch {
      // ignore
    } finally {
      setListLoading(false);
    }
  };

  /** 대화 목록에서 항목 선택: 해당 대화 메시지 로드 */
  const handleSelectConversation = async (id: number) => {
    if (id === conversationId) return;
    if (isLoading) return;
    setIsLoading(true);
    try {
      const list = await getConversationMessages(id);
      setConversationId(id);
      setMessages(list.map(mapApiMessageToUi));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const formatListDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      : d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
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
      <div ref={frameRef} className="relative z-10 flex h-[92dvh] w-[96%] overflow-hidden rounded-[30px] sm:rounded-[50px] bg-white shadow-[0_0_120px_rgba(255,182,193,0.4)] border-[6px] sm:border-[12px] border-rose-100/20 lg:w-[90%] xl:w-[85%]">
        
        {/* 사이드바: My Page + 대화 목록 (너비 드래그 조절 가능) */}
        <aside
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
          className="hidden shrink-0 flex-col bg-rose-50/15 p-6 lg:p-10 lg:flex border-r-2 border-rose-100/30"
        >
          <div className="mb-4">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tighter text-rose-500 italic">My Page</h2>
            <div className="mt-2 h-1 w-12 bg-rose-200 rounded-full" />
          </div>

          <button
            type="button"
            onClick={handleNewConversation}
            disabled={listLoading}
            className="mb-3 w-full rounded-[15px] lg:rounded-[20px] border-2 border-rose-300 bg-rose-400/20 py-3 px-4 text-sm lg:text-base font-black text-rose-600 transition-all hover:bg-rose-400/40 hover:border-rose-400 active:scale-95 disabled:opacity-50"
          >
            ＋ 새 대화 시작
          </button>

          {/* 대화 목록 버튼 → 클릭 시 팝업 */}
          <div ref={listPopoverRef} className="relative mb-4 shrink-0">
            <button
              type="button"
              onClick={() => setIsListOpen((o) => !o)}
              className="w-full rounded-[15px] lg:rounded-[20px] border-2 border-rose-200 bg-white/80 py-3 px-4 text-sm lg:text-base font-bold text-rose-600 transition-all hover:bg-rose-50 hover:border-rose-300 flex items-center justify-center gap-2"
            >
              <span>📋 대화 목록</span>
              <span className="text-rose-400">{isListOpen ? "▲" : "▼"}</span>
            </button>
            {isListOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[280px] overflow-y-auto rounded-2xl border-2 border-rose-100 bg-white p-3 shadow-xl scrollbar-hide">
                {listLoading && conversationList.length === 0 ? (
                  <p className="py-4 text-center text-rose-300 text-xs font-bold">불러오는 중...</p>
                ) : conversationList.length === 0 ? (
                  <p className="py-4 text-center text-rose-400 text-sm">저장된 대화가 없습니다.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {conversationList.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectConversation(c.id);
                            setIsListOpen(false);
                          }}
                          className={`w-full text-left rounded-xl border-2 p-2.5 lg:p-3 transition-all truncate ${
                            conversationId === c.id
                              ? "border-rose-400 bg-rose-100/80 text-rose-700"
                              : "border-transparent bg-rose-50/50 text-rose-600/90 hover:bg-rose-100 hover:border-rose-200"
                          }`}
                        >
                          <span className="block text-xs lg:text-sm font-bold truncate">{c.title || "제목 없음"}</span>
                          <span className="block text-[10px] lg:text-xs text-rose-400 mt-0.5">{formatListDate(c.lastMessageAt)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-3 lg:space-y-4 overflow-y-auto scrollbar-hide min-h-0">
            {siteConfig.chat.sidebar.items.map((item) => (
              <button 
                key={item} 
                onClick={() => {
                  if (item === "연애 report") {
                    if (conversationId != null && typeof window !== "undefined") {
                      localStorage.setItem("reportConversationId", String(conversationId));
                    }
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
                router.push("/survey?retake=1");
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

        {/* 리사이즈 핸들: 드래그로 My Page 너비 조절 */}
        <div
          role="separator"
          aria-label="사이드바 너비 조절"
          onMouseDown={() => setIsResizing(true)}
          className={`hidden lg:block w-1.5 shrink-0 cursor-col-resize bg-rose-100/50 hover:bg-rose-200 transition-colors ${isResizing ? "bg-rose-300" : ""}`}
        />

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
            className="flex-1 space-y-8 lg:space-y-12 overflow-y-auto px-6 pb-2 pt-4 lg:px-14 lg:pb-3 lg:pt-6 scrollbar-hide"
          >
            <div className="text-center mb-4 lg:mb-6">
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
          <footer className="px-4 py-3 lg:px-6 lg:py-4 bg-white/60 backdrop-blur-md border-t-2 border-rose-50/50">
            <div className="mb-2 lg:mb-3 flex flex-wrap gap-2 lg:gap-3 justify-center max-h-[100px] lg:max-h-none overflow-y-auto lg:overflow-visible">
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
                  placeholder={!conversationId ? "대화 준비 중..." : isLoading ? "답변을 기다리는 중..." : "고민을 입력하세요..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={!conversationId || isLoading}
                  className="flex-1 bg-transparent py-3 lg:py-5 text-base lg:text-xl font-bold text-rose-600 placeholder:text-rose-200 focus:outline-none disabled:opacity-50 min-w-0"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!conversationId || isLoading}
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
