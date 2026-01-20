"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export function SurveyScreen() {
  const router = useRouter();
  const totalQuestions = siteConfig.survey.questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [finalResult, setFinalResult] = useState("");

  useEffect(() => {
    const savedResult = localStorage.getItem("surveyResult");
    if (savedResult) {
      router.replace("/chat");
    }
  }, [router]);

  const currentQuestion = siteConfig.survey.questions[currentIndex];
  const selectedOption = answers[currentQuestion.id];
  const canProceed = selectedOption !== undefined;
  const isLast = currentIndex === totalQuestions - 1;

  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  const handleOptionSelect = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
    
    // 마지막 문제가 아니면 선택 후 자동으로 다음 문제로 이동
    if (!isLast) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300); // 0.3초 딜레이로 선택된 피드백을 보여줌
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (isLast && canProceed) {
      // 점수 계산 로직: 0 / 2 / 4 / 6 배점
      const optionScores = [
        [0, 2, 4, 6], // Q1: 경험 횟수 (0이면 모솔남 확정)
        [6, 4, 2, 0], // Q2: 데이트 준비
        [6, 4, 2, 0], // Q3: 호감 표현
        [6, 4, 2, 0], // Q4: 첫 만남 중요도
        [6, 4, 2, 0], // Q5: 갈등 해결
        [6, 4, 2, 0], // Q6: 설렘 순간
        [6, 4, 2, 0], // Q7: 선물 스타일
        [6, 4, 2, 0], // Q8: 진행 속도
      ];

      let result = "";
      // Q1(연애 경험)이 0회(index 0)이면 무조건 모솔남
      if (answers["q1"] === 0) {
        result = "모솔남";
      } else {
        let totalScore = 0;
        siteConfig.survey.questions.forEach((q, index) => {
          const answerIndex = answers[q.id];
          totalScore += optionScores[index][answerIndex];
        });

        // 최종 판정 기준 (사용자 정의 분포)
        if (totalScore >= 34) result = "근육테토남";
        else if (totalScore >= 24) result = "앙큼계략남";
        else if (totalScore >= 14) result = "스윗에겐남";
        else result = "예삐에삐남";
      }

      localStorage.setItem("surveyResult", result);
      setFinalResult(result);
      setShowResultPopup(true);
    }
  };

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
      <div className="relative z-10 flex h-[90vh] w-[94%] flex-col items-center justify-center rounded-[60px] bg-white shadow-[0_0_150px_rgba(255,182,193,0.6)] px-6 py-10 sm:w-[90%] lg:w-[85%]">
        <div className="w-full max-w-5xl text-center">
          <div className="mb-8 flex items-center justify-center gap-4 text-2xl font-bold text-rose-300">
            <span>Question</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              {currentIndex + 1}
            </span>
            <span className="text-rose-200">/</span>
            <span>{totalQuestions}</span>
          </div>

          <div className="w-full flex items-center justify-between gap-10">
            {/* 왼쪽 화살표 버튼 < */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-rose-100 bg-white text-5xl font-black text-rose-300 transition-all hover:border-rose-400 hover:text-rose-500 disabled:opacity-0 active:scale-90"
            >
              ‹
            </button>

            {/* 중앙 설문 내용 */}
            <div key={currentIndex} className="flex-1 animate-survey-slide-in px-4 sm:px-10">
              <h3 className="mb-12 text-4xl font-black tracking-tight text-rose-500 sm:text-6xl lg:text-7xl leading-[1.2] break-keep word-break-keep-all mx-auto max-w-4xl">
                {currentQuestion.text}
              </h3>
              
              <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = selectedOption === optionIndex;
                  return (
                    <button
                      key={`${currentQuestion.id}-option-${optionIndex}`}
                      type="button"
                      onClick={() => handleOptionSelect(optionIndex)}
                      className={`group relative flex items-center justify-center rounded-[30px] border-4 px-8 py-6 transition-all hover:scale-[1.02] active:scale-95 animate-option-fade-in ${
                        isSelected
                          ? "border-rose-400 bg-rose-500 text-white shadow-[0_15px_30px_rgba(244,114,182,0.3)]"
                          : "border-rose-100 bg-rose-50/30 text-rose-600 hover:border-rose-300 hover:bg-white"
                      }`}
                    >
                      <span className={`text-xl font-black sm:text-2xl leading-tight break-keep ${isSelected ? "text-white" : "text-rose-600"}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 오른쪽 공간 (마지막 문제에서만 DONE 표시) */}
            <div className="w-24 flex-shrink-0 flex items-center justify-center">
              {isLast && canProceed && (
                <button
                  onClick={handleNext}
                  className="w-48 px-6 py-8 bg-rose-500 border-4 border-rose-400 text-white rounded-full shadow-xl hover:scale-110 transition-all active:scale-90"
                >
                  <span className="text-3xl font-black">DONE ✨</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 결과 팝업 */}
      {showResultPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-[90%] max-w-xl scale-in-center rounded-[50px] bg-white p-12 text-center shadow-[0_0_100px_rgba(255,182,193,0.5)] overflow-hidden">
            {/* 데코레이션 요소 */}
            <div className="absolute -top-6 -left-6 text-6xl opacity-20 animate-float-heart">🎀</div>
            <div className="absolute -bottom-6 -right-6 text-6xl opacity-20 animate-float-heart" style={{ animationDelay: '1s' }}>💖</div>
            <div className="absolute top-1/4 -right-4 text-3xl opacity-10 animate-pulse">✨</div>
            <div className="absolute bottom-1/4 -left-4 text-3xl opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>

            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-center gap-3">
                <span className="text-2xl opacity-40">🎀</span>
                <div className="text-2xl font-black text-rose-400 uppercase tracking-widest">Test Result</div>
                <span className="text-2xl opacity-40">🎀</span>
              </div>
              
              <div className="mb-8">
                <span className="text-4xl font-bold text-rose-300">당신은...</span>
                <div className="relative inline-block mt-4">
                  <h2 className="text-7xl font-black text-rose-600 tracking-tighter">
                    {finalResult}
                  </h2>
                  <span className="absolute -top-4 -right-8 text-4xl animate-bounce">💖</span>
                </div>
              </div>

              <p className="mb-12 text-xl font-bold text-rose-400/80 leading-relaxed">
                분석이 완료되었습니다.<br />
                당신의 성향에 맞는 대화가 준비되었습니다.
              </p>
              
              <button
                onClick={() => router.push("/chat")}
                className="group relative w-full overflow-hidden rounded-full bg-rose-500 py-8 text-3xl font-black text-white shadow-[0_20px_40px_rgba(244,114,182,0.3)] transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  확인 <span className="text-2xl group-hover:animate-ping">✨</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
