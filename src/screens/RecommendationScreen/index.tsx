"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

/**
 * 나를 위한 소개팅 추천 화면 (RecommendationScreen)
 * 사용자의 성향과 대화 스타일을 분석하여 어울리는 상대 타입을 추천해주는 독립 페이지입니다.
 */
export function RecommendationScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRecommend = async () => {
    setIsLoading(true);
    try {
      const userArchetype = localStorage.getItem("surveyResult") || "앙큼계략남";
      const data = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: `나의 성향(${userArchetype})에 맞는 사람을 추천해줘.` }],
          requestType: "나를 위한 소개팅 추천"
        }),
      });
      setResult(data.reply || data.message);
    } catch (error) {
      console.error("Recommendation Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#eff6ff] select-none font-sans">
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-20 pointer-events-none">
        {Array.from({ length: 150 }).map((_, i) => (
          <span key={i} className="text-3xl animate-pulse">💎</span>
        ))}
      </div>

      <div className="relative z-10 flex h-[92dvh] w-[96%] flex-col rounded-[50px] bg-white shadow-2xl border-[10px] border-blue-100 lg:w-[80%] max-w-5xl overflow-hidden">
        <header className="flex items-center justify-between px-10 py-8 border-b-2 border-blue-50 bg-white">
          <button onClick={() => router.back()} className="text-blue-400 font-bold hover:text-blue-600">← 뒤로가기</button>
          <h2 className="text-3xl font-black text-blue-500 italic">Blind Date Match</h2>
          <div className="w-20" />
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-blue-600">나와 찰떡인 사람은 누구?</h3>
            <p className="text-blue-400 font-bold text-lg">데이터 분석을 통해 당신과 가장 잘 맞는 타입을 찾아드립니다.</p>
          </div>

          {!result ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-10">
              <div className="text-[120px] animate-bounce">💘</div>
              <button
                onClick={handleRecommend}
                className="w-full max-w-lg py-8 rounded-full bg-blue-500 text-3xl font-black text-white shadow-xl hover:bg-blue-600 transition-all active:scale-95"
              >
                매칭 시작하기 ✨
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-blue-50 p-12 rounded-[45px] border-4 border-blue-100 shadow-xl relative text-center">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-8xl">👑</div>
                <h4 className="text-3xl font-black text-blue-600 mb-8 mt-4 italic">Best Match Type</h4>
                <p className="text-2xl font-bold text-blue-800 leading-relaxed whitespace-pre-wrap">{result}</p>
              </div>
              <button
                onClick={() => setResult(null)}
                className="mt-10 w-full py-6 rounded-full border-4 border-blue-200 text-xl font-black text-blue-400 hover:bg-blue-50 transition-all"
              >
                다시 매칭받기
              </button>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
