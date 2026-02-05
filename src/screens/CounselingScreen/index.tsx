"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

/**
 * 진지하게 상담받기 화면 (CounselingScreen)
 * 채팅과는 별개로 전문적이고 깊이 있는 연애 상담을 제공하는 독립 페이지입니다.
 */
export function CounselingScreen() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  const handleCouseling = async () => {
    if (!content.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: content }],
          requestType: "진지하게 상담받기"
        }),
      });
      setResult(data.reply || data.message);
    } catch (error) {
      console.error("Counseling Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none">
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-30 pointer-events-none">
        {introEmojis.map((emoji, i) => (
          <span key={i} className="text-3xl animate-pulse">{emoji}</span>
        ))}
      </div>

      <div className="relative z-10 flex h-[92dvh] w-[96%] flex-col rounded-[50px] bg-white shadow-2xl border-[10px] border-rose-100/20 lg:w-[80%] max-w-5xl overflow-hidden">
        {/* 상단바 */}
        <header className="flex items-center justify-between px-10 py-8 border-b-2 border-rose-50 bg-white">
          <button onClick={() => router.back()} className="text-rose-400 font-bold hover:text-rose-600">← 뒤로가기</button>
          <h2 className="text-3xl font-black text-rose-500 italic">Serious Counseling</h2>
          <div className="w-20" />
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-rose-600">무엇이든 털어놓으세요</h3>
            <p className="text-rose-400 font-bold text-lg">당신의 깊은 고민을 전문가의 시선으로 분석해 드립니다.</p>
          </div>

          {!result ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="고민 내용을 상세히 적어주세요... (예: 썸녀랑 연락이 끊겼어요, 권태기가 온 것 같아요 등)"
                className="w-full h-64 p-8 rounded-[35px] border-4 border-rose-100 bg-rose-50/30 text-xl font-bold text-rose-700 focus:outline-none focus:border-rose-400 transition-all resize-none"
              />
              <button
                onClick={handleCouseling}
                disabled={isLoading}
                className="w-full py-6 rounded-full bg-rose-500 text-2xl font-black text-white shadow-xl hover:bg-rose-600 transition-all active:scale-95 disabled:bg-rose-300"
              >
                {isLoading ? "분석 중..." : "상담 시작하기 ✨"}
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-rose-50 p-10 rounded-[45px] border-4 border-rose-100 shadow-inner">
                <p className="text-2xl font-bold text-rose-800 leading-relaxed whitespace-pre-wrap">{result}</p>
              </div>
              <button
                onClick={() => setResult(null)}
                className="mt-10 w-full py-6 rounded-full border-4 border-rose-200 text-xl font-black text-rose-400 hover:bg-rose-50 transition-all"
              >
                다른 고민 상담하기
              </button>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
