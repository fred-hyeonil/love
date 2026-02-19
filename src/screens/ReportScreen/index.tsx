"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  fetchConversationReport,
  fetchConversationReportByConversationId,
  type ConversationReportResponse,
  type ReportMessageItem,
} from "@/lib/api";

/**
 * 연애 리포트 화면 (ReportScreen)
 * 대화 종료 후 자바→Python 감정 분석 보고서(실제 API 응답)만 표시. 하드코딩 없음.
 */
export function ReportScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<ConversationReportResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [character, setCharacter] = useState({ name: "동그라미", emoji: "⭕" });

  /** 보고서에서 채팅으로 갈 때, 방금 보던 대화( reportConversationId )로 복원 */
  const goToChat = () => {
    if (typeof window === "undefined") {
      router.push("/chat");
      return;
    }
    const id = localStorage.getItem("reportConversationId");
    if (id) {
      sessionStorage.setItem("chatRestoreId", id);
      router.push(`/chat?restore=${id}`);
    } else {
      router.push("/chat");
    }
  };

  useEffect(() => {
    const savedIdeal = localStorage.getItem("selectedIdeal");
    if (savedIdeal) {
      try {
        const parsed = JSON.parse(savedIdeal);
        setCharacter(parsed);
      } catch {
        // ignore
      }
    }

    const fetchReport = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setErrorMessage("로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      const conversationId = localStorage.getItem("reportConversationId");

      try {
        let data: ConversationReportResponse;
        if (conversationId) {
          // 인증 필수: POST /api/conversations/{id}/report (apiFetch → Authorization: Bearer <token> 자동)
          data = await fetchConversationReportByConversationId(conversationId);
        } else {
          const raw = localStorage.getItem("currentChatUtterances");
          if (!raw) {
            setErrorMessage("대화 내용이 없습니다. 채팅에서 대화 종료 후 다시 시도해 주세요.");
            setIsLoading(false);
            return;
          }
          const utterances: { role: string; text: string }[] = JSON.parse(raw);
          const userTexts = utterances.filter((u) => u.role === "user").map((u) => u.text);
          const assistantTexts = utterances.filter((u) => u.role === "assistant").map((u) => u.text);
          data = await fetchConversationReport(userTexts, assistantTexts);
        }
        setReport(data);
        setErrorMessage(null);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 0) {
            setErrorMessage("서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.");
          } else if (err.status === 401) {
            setErrorMessage("인증에 실패했습니다. 로그인 후 다시 시도해 주세요.");
          } else if (err.status === 403) {
            setErrorMessage("이 대화에 대한 권한이 없습니다.");
          } else if (err.status === 404) {
            setErrorMessage("대화를 찾을 수 없습니다.");
          } else if (err.status === 503) {
            setErrorMessage("감정 분석 서버 오류입니다. 잠시 후 다시 시도해 주세요.");
          } else {
            setErrorMessage("보고서를 불러오는 중 오류가 발생했습니다.");
          }
          setReport(null);
          return;
        }
        console.error("Report Fetch Error:", err);
        setErrorMessage("보고서를 불러오는 중 오류가 발생했습니다.");
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, []);

  /** 결과 보고서 배경용 이모지 - 채팅 화면처럼 다양·화려하게 가득 */
  const reportBgEmojis = [
    "💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐",
    "💕", "🌟", "💝", "🌺", "🦋", "🌼", "💮", "🏵️", "🌻", "🥀", "🪷", "🎴", "🩷", "💓", "💟", "🫧",
    "🌙", "🌈", "🪻", "🩵", "💜", "🤍", "💛", "🍬", "🎂", "🍰", "🧁", "🫐", "🍓", "🪸", "🐚", "🎁",
    "🏆", "👑", "🦄", "🐇", "🩰", "🎪", "🎠", "💐", "💮", "🌷", "🌼", "🫧", "💫", "🩷", "💗", "✨",
  ];

  /** API의 counts 객체 → 막대그래프용 { emotion, percent, count }[] (응답 그대로 사용) */
  function countsToChartData(counts: Record<string, number> | undefined): { emotion: string; percent: number; count: number }[] {
    if (!counts || !Object.keys(counts).length) return [];
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Object.entries(counts)
      .map(([emotion, count]) => ({ emotion, count, percent: Math.round((count / total) * 1000) / 10 }))
      .sort((a, b) => b.percent - a.percent);
  }

  /** counts 없을 때만: 메시지 배열에서 감정별 비율 계산 (하위 호환) */
  function getEmotionPercentagesFromMessages(items: ReportMessageItem[]): { emotion: string; percent: number; count: number }[] {
    if (!items.length) return [];
    const countByEmotion: Record<string, number> = {};
    for (const msg of items) {
      const e = (msg.emotion || "").trim() || "기타";
      countByEmotion[e] = (countByEmotion[e] ?? 0) + 1;
    }
    const total = items.length;
    return Object.entries(countByEmotion)
      .map(([emotion, count]) => ({ emotion, count, percent: Math.round((count / total) * 1000) / 10 }))
      .sort((a, b) => b.percent - a.percent);
  }

  /** messages[].scoresPct 평균 → 감정별 퍼센트 (0~100, 응답 그대로 사용) */
  function getEmotionScoresPctAverage(items: ReportMessageItem[]): { emotion: string; percent: number }[] {
    if (!items.length) return [];
    const sumByEmotion: Record<string, number> = {};
    const keyCount: Record<string, number> = {};
    for (const msg of items) {
      const pct = msg.scoresPct ?? (msg.scores ? toPct(msg.scores) : {});
      for (const [name, val] of Object.entries(pct)) {
        const v = typeof val === "number" ? val : 0;
        sumByEmotion[name] = (sumByEmotion[name] ?? 0) + v;
        keyCount[name] = (keyCount[name] ?? 0) + 1;
      }
    }
    return Object.entries(sumByEmotion)
      .map(([emotion, sum]) => ({ emotion, percent: Math.round((sum / (keyCount[emotion] || 1)) * 10) / 10 }))
      .sort((a, b) => b.percent - a.percent);
  }

  function toPct(scores: Record<string, number>): Record<string, number> {
    return Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, typeof v === "number" ? (v > 1 ? v : v * 100) : 0])
    );
  }

  const emotionBarColors: Record<string, string> = {
    기쁨: "bg-pink-400",
    슬픔: "bg-sky-500",
    분노: "bg-rose-500",
    불안: "bg-violet-400",
    평온: "bg-emerald-500",
    무덤덤: "bg-stone-400",
    두려움: "bg-indigo-400",
    기타: "bg-rose-300",
  };

  /** 사용자 메시지 기준 감정 전환 횟수 (연속 메시지에서 감정이 바뀐 횟수) */
  function getEmotionTransitionCount(messages: ReportMessageItem[]): number {
    let count = 0;
    for (let i = 1; i < messages.length; i++) {
      if ((messages[i].emotion || "").trim() !== (messages[i - 1].emotion || "").trim()) count++;
    }
    return count;
  }

  /** 감정 기복 수준: 안정(0~1) / 보통(2~3) / 높음(4+) */
  function getFluctuationLevel(transitionCount: number): "안정" | "보통" | "높음" {
    if (transitionCount <= 1) return "안정";
    if (transitionCount <= 3) return "보통";
    return "높음";
  }

  /** 사용자 메시지에서 질문 비율 (텍스트에 ? 포함) */
  function getQuestionRatio(messages: ReportMessageItem[]): number {
    if (!messages.length) return 0;
    const withQ = messages.filter((m) => (m.text || "").includes("?")).length;
    return Math.round((withQ / messages.length) * 1000) / 10;
  }

  /** 강한 표현 사용 여부 (간단 키워드) */
  const STRONG_WORDS = /진짜|너무|존나|미치|화나|짜증|답답|힘들|심해|완전/;
  function hasStrongExpressions(messages: ReportMessageItem[]): boolean {
    return messages.some((m) => STRONG_WORDS.test(m.text || ""));
  }

  /** 감정 강조(슬픔·분노·불안 등) 비율이 높은지 */
  function hasEmotionEmphasis(counts: Record<string, number> | undefined): boolean {
    if (!counts) return false;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return false;
    const strong = (counts["슬픔"] ?? 0) + (counts["분노"] ?? 0) + (counts["불안"] ?? 0);
    return total > 0 && strong / total >= 0.4;
  }

  /** 가로 막대 그래프: 하단 보조 데이터용 */
  function HorizontalBarChart({
    counts,
    messages,
    title,
    subtitle,
  }: {
    counts?: Record<string, number>;
    messages?: ReportMessageItem[];
    title: string;
    subtitle?: string;
  }) {
    const data =
      countsToChartData(counts).length > 0
        ? countsToChartData(counts)
        : getEmotionPercentagesFromMessages(messages ?? []);
    return (
      <div className="bg-white rounded-2xl border border-rose-100/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-rose-50 bg-gradient-to-r from-rose-50/80 to-white">
          <h3 className="text-lg font-bold text-rose-700 tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-rose-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-6">
          {data.length === 0 ? (
            <p className="text-rose-400 text-sm py-4">분석된 메시지가 없습니다.</p>
          ) : (
            <div className="space-y-5">
              {data.map(({ emotion, percent, count }) => (
                <div key={emotion} className="group">
                  <div className="flex items-center justify-between gap-4 mb-1.5">
                    <span className="text-sm font-semibold text-rose-700 min-w-[4rem]">{emotion}</span>
                    <span className="text-xs text-rose-400 tabular-nums">{count}회 · {percent}%</span>
                  </div>
                  <div className="h-7 w-full bg-rose-50/70 rounded-full overflow-hidden border border-rose-100/60">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${emotionBarColors[emotion] ?? "bg-rose-300"}`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none font-sans">
      {/* 채팅 화면처럼 핑크 배경 이모티콘 파티 - 다양하게 가득 */}
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 p-8 sm:p-10 opacity-30 pointer-events-none">
        {Array.from({ length: 150 }).map((_, i) => (
          <span
            key={i}
            className="text-2xl sm:text-3xl animate-pulse"
            style={{
              animationDelay: `${(i * 0.1) % 2}s`,
              transform: `rotate(${(i * 45) % 360}deg)`,
            }}
          >
            {reportBgEmojis[i % reportBgEmojis.length]}
          </span>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-rose-100/50 via-pink-50/30 to-amber-50/40 pointer-events-none" style={{ zIndex: -1 }} />

      <div className="relative z-10 flex h-[92dvh] w-[96%] flex-col rounded-2xl bg-white shadow-xl border border-stone-200/80 lg:w-[88%] max-w-5xl overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white shrink-0">
          <button
            onClick={goToChat}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            ← 채팅으로
          </button>
          <span className="text-lg font-bold text-rose-600 tracking-tight">Love Report</span>
          <div className="w-16" />
        </header>

        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 scrollbar-hide bg-stone-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-6xl animate-bounce">📊</div>
              <p className="text-2xl font-black text-rose-400">데이터를 정교하게 분석 중입니다...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <p className="text-xl font-bold text-rose-600">{errorMessage}</p>
              <button
                onClick={() => (errorMessage === "로그인이 필요합니다." ? router.push("/login") : goToChat())}
                className="px-6 py-3 rounded-2xl bg-rose-100 text-rose-600 font-bold hover:bg-rose-200"
              >
                {errorMessage === "로그인이 필요합니다." ? "로그인하기" : "채팅으로 돌아가기"}
              </button>
            </div>
          ) : report ? (
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
              {/* 타이틀: 연애 상담 리포트 톤 */}
              <div className="text-center pt-2 pb-6">
                <p className="text-xs font-medium text-rose-400 tracking-widest mb-2">연애 대화 습관 리포트</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-rose-700 tracking-tight">
                  당신의 대화를 돌아보는 시간
                </h1>
                <p className="text-sm text-rose-500/80 mt-2">관계 코칭 관점에서 정리했어요</p>
              </div>

              {/* 1. 관계 분위기 한 줄 요약 + 감정 분포 차트 (한 섹션) */}
              <section className="rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-rose-100/60">
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">관계 분위기 한줄 요약</p>
                  <p className="text-lg text-rose-800 leading-relaxed">
                    {report.summary || "이번 대화에서의 감정 흐름이 잘 담겨 있어요. 조금만 더 정리해 보면 좋겠어요."}
                  </p>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-4">감정 분포</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HorizontalBarChart
                      counts={report.details?.userReport?.counts}
                      messages={report.details?.userReport?.messages}
                      title="나의 감정"
                      subtitle={report.details?.userReport?.summary}
                    />
                    <HorizontalBarChart
                      counts={report.details?.assistantReport?.counts}
                      messages={report.details?.assistantReport?.messages}
                      title="상대방 감정"
                      subtitle={report.details?.assistantReport?.summary}
                    />
                  </div>
                </div>
              </section>

              {/* 2. 감정 기복 카드 - 전환 횟수 + 배지 */}
              {(() => {
                const userMessages = report.details?.userReport?.messages ?? [];
                const transitions = getEmotionTransitionCount(userMessages);
                const level = getFluctuationLevel(transitions);
                const badgeClass =
                  level === "안정"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : level === "보통"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-rose-100 text-rose-700 border-rose-200";
                return (
                  <section className="rounded-2xl bg-white border border-rose-100/80 shadow-sm p-6">
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3">감정 기복</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-3xl font-black text-rose-600 tabular-nums">{transitions}</span>
                      <span className="text-rose-600 font-medium">번 감정이 전환되었어요</span>
                      <span className={`rounded-full border px-3 py-1 text-sm font-bold ${badgeClass}`}>
                        {level === "안정" ? "😌 안정" : level === "보통" ? "🙂 보통" : "💭 높음"}
                      </span>
                    </div>
                    <p className="text-sm text-rose-500 mt-2">
                      {level === "안정" && "감정이 안정적으로 유지된 대화예요."}
                      {level === "보통" && "적당한 감정 변화가 있었어요."}
                      {level === "높음" && "감정 변화가 많았어요. 한 가지씩 정리해 보면 좋아요."}
                    </p>
                  </section>
                );
              })()}

              {/* 3. 당신의 대화 습관 카드 - 아이콘 기반 */}
              {(() => {
                const userMessages = report.details?.userReport?.messages ?? [];
                const userCounts = report.details?.userReport?.counts;
                const questionRatio = getQuestionRatio(userMessages);
                const strong = hasStrongExpressions(userMessages);
                const emotionHeavy = hasEmotionEmphasis(userCounts);
                return (
                  <section className="rounded-2xl bg-white border border-rose-100/80 shadow-sm p-6">
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-4">당신의 대화 습관</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                        <span className="text-2xl">{strong ? "💬" : "✨"}</span>
                        <div>
                          <p className="font-semibold text-rose-700 text-sm">강한 표현</p>
                          <p className="text-rose-600 text-sm">{strong ? "사용한 편이에요" : "부드러운 편이에요"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                        <span className="text-2xl">❓</span>
                        <div>
                          <p className="font-semibold text-rose-700 text-sm">질문 비율</p>
                          <p className="text-rose-600 text-sm">{questionRatio}%</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                        <span className="text-2xl">{emotionHeavy ? "💗" : "🌿"}</span>
                        <div>
                          <p className="font-semibold text-rose-700 text-sm">감정 강조</p>
                          <p className="text-rose-600 text-sm">{emotionHeavy ? "감정 표현이 풍부해요" : "차분한 편이에요"}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })()}

              {/* 4. 이렇게 말해보면 어때요 - 백엔드 userFocusReport.coaching 사용 */}
              <section className="rounded-2xl bg-gradient-to-br from-rose-50/90 to-pink-50/80 border-2 border-rose-200/80 shadow-lg p-8">
                <h2 className="text-xl font-bold text-rose-700 mb-2">이렇게 말해보면 어때요?</h2>
                <p className="text-rose-600 text-sm mb-6">관계 코칭 관점에서 추천하는 말하기예요.</p>
                <div className="space-y-4">
                  {(() => {
                    const coaching = report.details?.userFocusReport?.coaching ?? [];
                    return coaching.length > 0 ? (
                      coaching.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-white/90 border border-rose-100 p-4 shadow-sm"
                        >
                          <p className="text-rose-700 leading-relaxed">{s}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-rose-400 text-sm py-2">추천 문장이 없어요. 대화를 더 나눠 보면 코칭을 받을 수 있어요.</p>
                    );
                  })()}
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {[
                  { emoji: "👑", label: "진지하게 상담받기", sub: "1:1 프리미엄 케어", onClick: () => router.push("/counseling") },
                  { emoji: "📱", label: "카톡 내용 평가받기", sub: "대화 캡처 분석", onClick: () => router.push("/evaluation") },
                  { emoji: "🔄", label: "채팅 다시 하기", sub: "캐릭터와 계속 대화", onClick: goToChat },
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={btn.onClick}
                    className="group relative flex flex-col items-center justify-center rounded-[40px] border-8 border-rose-100 bg-white p-8 transition-all hover:scale-[1.03] active:scale-95 shadow-xl hover:border-rose-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-rose-50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="text-5xl mb-4 group-hover:animate-bounce relative z-10">{btn.emoji}</span>
                    <span className="text-2xl font-black text-rose-600 relative z-10 tracking-tighter">
                      {btn.label}
                    </span>
                    <span className="text-sm font-bold text-rose-300 mt-2 relative z-10">{btn.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-xl font-bold text-rose-600">보고서 데이터가 없습니다.</p>
              <button
                onClick={goToChat}
                className="mt-4 px-6 py-3 rounded-2xl bg-rose-100 text-rose-600 font-bold hover:bg-rose-200"
              >
                채팅으로 돌아가기
              </button>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
