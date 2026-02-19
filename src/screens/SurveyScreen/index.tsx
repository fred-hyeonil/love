"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";
import { ApiError, getSession, getStoredSession, postPartnerType } from "@/lib/api";

function ConfirmResultButton({
  value,
  onSuccess,
}: {
  value: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await postPartnerType(value);
      try {
        await getSession();
      } catch {
        // 저장은 성공했는데 세션 갱신만 실패한 경우에도 채팅으로 이동
      }
      onSuccess();
    } catch (e) {
      if (e instanceof ApiError) {
        // 디버깅: 서버가 어떤 상태코드/메시지로 거부했는지 확인
        console.warn("[Survey] partner-type 저장 실패:", e.status, e.statusText, e.body);
        if (e.status === 401) {
          setError("로그인이 만료되었을 수 있어요. 다시 로그인하거나 채팅으로 이동해 주세요.");
          return;
        }
        if (e.status === 409) {
          setError("이미 유형이 설정되어 있습니다.");
          await getSession().catch(() => {});
          onSuccess();
          return;
        }
      }
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 space-y-3">
          <p className="text-red-500 font-bold">{error}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="px-5 py-2.5 rounded-full bg-rose-100 text-rose-700 font-bold hover:bg-rose-200"
            >
              채팅으로 이동
            </button>
            {error.includes("로그인") && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") localStorage.removeItem("accessToken");
                  router.push("/login");
                }}
                className="px-5 py-2.5 rounded-full bg-rose-200 text-rose-800 font-bold hover:bg-rose-300"
              >
                다시 로그인
              </button>
            )}
          </div>
        </div>
      )}
      <button
        onClick={handleConfirm}
        disabled={submitting}
        className="group relative w-full overflow-hidden rounded-full bg-rose-500 py-8 text-3xl font-black text-white shadow-[0_20px_40px_rgba(244,114,182,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
      >
        {submitting ? "저장 중..." : "확인 ✨"}
      </button>
    </>
  );
}

/**
 * 설문조사 화면 (SurveyScreen)
 * 사용자의 연애 성향 및 남성성 지표를 테스트하는 화면입니다.
 * 8개의 문항에 대한 답변을 수집하여 최종 성격 유형(앙큼계략남 등)을 판정합니다.
 */
export function SurveyScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalQuestions = siteConfig.survey.questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [finalResult, setFinalResult] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isRetake = searchParams.get("retake") === "1" || searchParams.has("retake");

  // 인증 체크. 이미 테스트 완료(partnerType.isSet)면 채팅으로 → 단, "성격 테스트 다시 하기"로 들어온 경우(retake)는 스킵
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    if (isRetake) return;
    const session = getStoredSession();
    if (session?.partnerType?.isSet) {
      router.replace("/chat");
    }
  }, [router, isRetake]);

  const currentQuestion = siteConfig.survey.questions[currentIndex];
  const selectedOption = answers[currentQuestion.id];
  const canProceed = selectedOption !== undefined;
  const isLast = currentIndex === totalQuestions - 1;

  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  /**
   * 답변 항목 선택 시 처리
   * 마지막 문제가 아니면 0.4초 후 자동으로 다음 문항으로 이동합니다.
   */
  const handleOptionSelect = (optionIndex: number) => {
    if (isTransitioning) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));

    if (!isLast) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsTransitioning(false);
      }, 400);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  /**
   * 'DONE' 버튼 클릭 시 최종 결과 계산
   * 점수에 따라 근육테토남, 앙큼계략남, 스윗에겐남, 예삐에삐남 등으로 분류합니다.
   */
  const handleNext = () => {
    if (!canProceed) return;

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // 결과 판정 점수표 (0 / 2 / 4 / 6 배점)
    const optionScores = [
      [0, 2, 4, 6], // Q1: 경험 횟수 (0이면 모솔남 확정)
      [6, 4, 2, 0], [6, 4, 2, 0], [6, 4, 2, 0], 
      [6, 4, 2, 0], [6, 4, 2, 0], [6, 4, 2, 0], [6, 4, 2, 0]
    ];

    let result = "";
    // Q1(경험 0회) 예외 처리
    if (answers["q1"] === 0) {
      result = "모솔남";
    } else {
      let totalScore = 0;
      siteConfig.survey.questions.forEach((q, index) => {
        const answerIndex = answers[q.id];
        totalScore += optionScores[index][answerIndex];
      });

      if (totalScore >= 34) result = "근육테토남";
      else if (totalScore >= 24) result = "앙큼계략남";
      else if (totalScore >= 14) result = "스윗에겐남";
      else result = "예삐에삐남";
    }

    setFinalResult(result);
    setShowResultPopup(true);
  };

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none">
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-30 pointer-events-none">
        {Array.from({ length: 180 }).map((_, i) => (
          <span key={i} className="text-3xl sm:text-4xl" style={{ transform: `rotate(${(i * 30) % 360}deg)` }}>
            {introEmojis[i % introEmojis.length]}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex h-[92dvh] w-[96%] flex-col items-center justify-center rounded-[40px] sm:rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-4 py-8 sm:px-6 sm:py-10 sm:w-[90%] lg:w-[85%]">
        <div className="w-full max-w-5xl text-center h-full flex flex-col justify-center">
          <div className="mb-4 sm:mb-8 flex items-center justify-center gap-3 sm:gap-4 text-lg sm:text-2xl font-bold text-rose-300">
            <span>Question</span>
            <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              {currentIndex + 1}
            </span>
            <span className="text-rose-200">/</span>
            <span>{totalQuestions}</span>
          </div>

          <div className="w-full flex items-center justify-between gap-4 sm:gap-10">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex h-16 w-16 sm:h-24 sm:w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-rose-100 bg-white text-3xl sm:text-5xl font-black text-rose-300 transition-all hover:border-rose-400 hover:text-rose-500 disabled:opacity-0 active:scale-90"
            >
              ‹
            </button>

            <div key={currentIndex} className="flex-1 animate-survey-slide-in px-2 sm:px-10 overflow-y-auto max-h-[70vh] scrollbar-hide">
              <h3 className="mb-6 sm:mb-12 text-2xl font-black tracking-tight text-rose-500 sm:text-5xl lg:text-6xl leading-[1.2] break-keep word-break-keep-all mx-auto max-w-4xl">
                {currentQuestion.text}
              </h3>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4 max-w-4xl mx-auto">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = selectedOption === optionIndex;
                  return (
                    <button
                      key={`${currentQuestion.id}-option-${optionIndex}`}
                      type="button"
                      onClick={() => handleOptionSelect(optionIndex)}
                      className={`group relative flex items-center justify-center rounded-[20px] sm:rounded-[30px] border-4 px-6 py-4 sm:px-8 sm:py-6 transition-all hover:scale-[1.01] active:scale-95 animate-option-fade-in ${
                        isSelected
                          ? "border-rose-400 bg-rose-500 text-white shadow-[0_15px_30px_rgba(244,114,182,0.3)]"
                          : "border-rose-100 bg-rose-50/30 text-rose-600 hover:border-rose-300 hover:bg-white"
                      }`}
                    >
                      <span className={`text-base font-black sm:text-xl lg:text-2xl leading-tight break-keep ${isSelected ? "text-white" : "text-rose-600"}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-16 sm:w-24 flex-shrink-0 flex items-center justify-center">
              {isLast && canProceed && (
                <button
                  onClick={handleNext}
                  className="w-32 sm:w-48 px-4 py-6 sm:px-6 sm:py-8 bg-rose-500 border-4 border-rose-400 text-white rounded-full shadow-xl hover:scale-110 transition-all active:scale-90"
                >
                  <span className="text-xl sm:text-3xl font-black">DONE ✨</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showResultPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-[90%] max-w-xl scale-in-center rounded-[50px] bg-white p-12 text-center shadow-[0_0_100px_rgba(255,182,193,0.5)] overflow-hidden">
            <div className="relative z-10">
              <div className="mb-8">
                <span className="text-4xl font-bold text-rose-300">당신은...</span>
                <div className="relative inline-block mt-4">
                  <h2 className="text-7xl font-black text-rose-600 tracking-tighter">{finalResult}</h2>
                  <span className="absolute -top-4 -right-8 text-4xl animate-bounce">💖</span>
                </div>
              </div>
              <p className="mb-12 text-xl font-bold text-rose-400/80 leading-relaxed">분석이 완료되었습니다.<br />당신의 성향에 맞는 대화가 준비되었습니다.</p>
              <ConfirmResultButton
                value={finalResult}
                onSuccess={() => router.push("/chat")}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
