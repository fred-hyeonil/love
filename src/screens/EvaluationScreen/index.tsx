"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

/**
 * 카톡 내용 평가받기 화면 (EvaluationScreen)
 * 실제 대화 내용을 업로드하거나 붙여넣어 대화의 분위기나 텐션을 평가받는 독립 페이지입니다.
 */
export function EvaluationScreen() {
  const router = useRouter();
  const [chatText, setChatText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const introEmojis = ["💌", "📱", "💬", "✨", "💓", "🍭", "🎀", "⭐"];

  const handleEvaluate = async () => {
    if (!chatText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: chatText }],
          requestType: "카톡 내용 평가받기"
        }),
      });
      setResult(data.reply || data.message);
    } catch (error) {
      console.error("Evaluation Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white select-none">
      {/* 노란색/카톡 느낌 배경 배경 */}
      <div className="absolute inset-0 -z-10 bg-[#fde047] opacity-20" />
      
      <div className="relative z-10 flex h-[92dvh] w-[96%] flex-col rounded-[50px] bg-white shadow-2xl border-[10px] border-yellow-400/20 lg:w-[80%] max-w-5xl overflow-hidden">
        <header className="flex items-center justify-between px-10 py-8 border-b-2 border-yellow-100 bg-white">
          <button onClick={() => router.back()} className="text-yellow-600 font-bold hover:text-yellow-800">← 뒤로가기</button>
          <h2 className="text-3xl font-black text-yellow-500 italic">Chat Evaluation</h2>
          <div className="w-20" />
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-yellow-600">우리의 텐션은 몇 점?</h3>
            <p className="text-yellow-700 font-bold text-lg text-opacity-60">나눈 대화 내용을 복사해서 붙여넣어 보세요.</p>
          </div>

          {!result ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="relative">
                <textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="대화 내용을 입력하세요...&#10;(예: 나: 안녕 뭐해?&#10;그녀: 그냥 있어 ㅎㅎ)"
                  className="w-full h-80 p-8 rounded-[35px] border-4 border-yellow-200 bg-yellow-50/30 text-xl font-bold text-yellow-800 focus:outline-none focus:border-yellow-400 transition-all resize-none"
                />
                <div className="absolute bottom-6 right-8 text-6xl opacity-20">📱</div>
              </div>
              <button
                onClick={handleEvaluate}
                disabled={isLoading}
                className="w-full py-6 rounded-full bg-yellow-400 text-2xl font-black text-yellow-900 shadow-xl hover:bg-yellow-500 transition-all active:scale-95 disabled:bg-yellow-200"
              >
                {isLoading ? "분석 중..." : "텐션 분석하기 🔥"}
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-yellow-50 p-10 rounded-[45px] border-4 border-yellow-200 shadow-xl relative">
                <div className="absolute -top-6 -right-6 text-6xl">⭐</div>
                <h4 className="text-2xl font-black text-yellow-700 mb-6 underline underline-offset-8">분석 결과 리포트</h4>
                <p className="text-xl font-bold text-yellow-900 leading-relaxed whitespace-pre-wrap">{result}</p>
              </div>
              <button
                onClick={() => setResult(null)}
                className="mt-10 w-full py-6 rounded-full border-4 border-yellow-300 text-xl font-black text-yellow-600 hover:bg-yellow-50 transition-all"
              >
                다른 대화 분석하기
              </button>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
