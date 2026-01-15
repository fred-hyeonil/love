"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export function SurveyScreen() {
  const router = useRouter();
  const totalQuestions = siteConfig.survey.questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
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
      router.push("/chat");
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
            <div key={currentIndex} className="flex-1 survey-content-enter px-4 sm:px-10">
              <h3 className="mb-12 text-4xl font-black tracking-tight text-rose-500 sm:text-6xl lg:text-7xl leading-[1.2] break-keep word-break-keep-all mx-auto max-w-4xl">
                {currentQuestion.text}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = selectedOption === optionIndex;
                  return (
                    <button
                      key={`${currentQuestion.id}-option-${optionIndex}`}
                      type="button"
                      onClick={() => handleOptionSelect(optionIndex)}
                      style={{ animationDelay: `${optionIndex * 0.05}s` }}
                      className={`group relative flex items-center justify-center rounded-[35px] border-4 px-10 py-10 transition-all hover:scale-105 active:scale-95 option-button-appear ${
                        isSelected
                          ? "border-rose-400 bg-rose-500 text-white shadow-[0_20px_40px_rgba(244,114,182,0.3)]"
                          : "border-rose-100 bg-rose-50/30 text-rose-600 hover:border-rose-300 hover:bg-white"
                      }`}
                    >
                      <span className={`text-2xl font-black sm:text-3xl leading-tight break-keep ${isSelected ? "text-white" : "text-rose-600"}`}>
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

        {/* 하단 타입 태그들 */}
        <div className="absolute bottom-8 flex flex-wrap justify-center gap-3">
          {siteConfig.survey.archetypes.map((type) => (
            <span
              key={type}
              className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-300"
            >
              #{type}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
