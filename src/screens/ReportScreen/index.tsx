"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { siteConfig } from "@/config/site";

/**
 * 연애 리포트 화면 (ReportScreen)
 * 지금까지의 대화 내용을 바탕으로 BERT 감정 분석 및 GPT 추천을 보여주는 독립 페이지입니다.
 */
export function ReportScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    userEmotionSummary: Record<string, number>;
    partnerEmotionSummary: Record<string, number>;
    suggestion: string;
  } | null>(null);
  
  // 기본 하드코딩 데이터 (백엔드 에러 시 대비)
  const [reportStats] = useState({
    masculinity: 85,
    sensitivity: 65,
    directness: 40,
    attentiveness: 90
  });

  const [character, setCharacter] = useState({
    name: "동그라미",
    emoji: "⭕"
  });

  useEffect(() => {
    // 1. 선택한 캐릭터 정보 로드
    const savedIdeal = localStorage.getItem("selectedIdeal");
    if (savedIdeal) {
      try {
        const parsed = JSON.parse(savedIdeal);
        setCharacter(parsed);
      } catch (e) {}
    }

    // 2. 리포트 데이터 요청
    const fetchReport = async () => {
      const utterancesRaw = localStorage.getItem("currentChatUtterances");
      if (!utterancesRaw) {
        setIsLoading(false);
        return;
      }

      try {
        const utterances = JSON.parse(utterancesRaw);
        const data = await apiFetch("/api/emotion-analysis/conversation-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ utterances }),
        });
        setReportData(data);
      } catch (error) {
        console.error("Report Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, []);

  const introEmojis = ["💖", "✨", "💗", "🌸", "💞", "🎀", "💘", "🌷", "🌹", "🎈", "🧸", "💌", "🍭", "🍀", "💎", "⭐"];

  return (
    <section className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-rose-50 select-none font-sans">
      <div className="absolute inset-0 -z-10 flex flex-wrap items-center justify-center gap-8 p-10 opacity-30 pointer-events-none">
        {introEmojis.map((emoji, i) => (
          <span key={i} className="text-3xl animate-pulse">{emoji}</span>
        ))}
      </div>

      <div className="relative z-10 flex h-[92dvh] w-[96%] flex-col rounded-[50px] bg-white shadow-2xl border-[10px] border-rose-100/20 lg:w-[85%] max-w-6xl overflow-hidden">
        <header className="flex items-center justify-between px-10 py-8 border-b-2 border-rose-50 bg-white">
          <button onClick={() => router.back()} className="text-rose-400 font-bold hover:text-rose-600">← 뒤로가기</button>
          <h2 className="text-3xl font-black text-rose-500 italic">Love Report</h2>
          <div className="w-20" />
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide bg-white/60">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-6xl animate-bounce">📊</div>
              <p className="text-2xl font-black text-rose-400">데이터를 정교하게 분석 중입니다...</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="text-center">
                <h3 className="text-5xl font-black text-rose-500 tracking-tighter mb-4 italic">당신의 연애 성향 분석 리포트</h3>
                <p className="text-rose-300 font-bold tracking-widest uppercase text-sm">대화와 설문 데이터를 기반으로 도출된 결과입니다.</p>
              </div>

              <div className="rounded-[45px] border-[8px] border-rose-100 bg-white p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl select-none pointer-events-none">📜</div>
                
                <div className="space-y-8 relative z-10">
                  <div className="bg-rose-50 p-8 rounded-[35px] border-4 border-rose-100 shadow-inner">
                    <p className="text-2xl font-bold text-rose-700 leading-relaxed break-keep">
                      {reportData?.suggestion ? (
                        `"${reportData.suggestion}"`
                      ) : (
                        `"당신은 상대방의 배려를 중요하게 생각하면서도, 자신의 감정을 표현하는 데에 조심스러운 편이시네요. 
                        선택하신 ${character.name}와의 대화 패턴을 분석해보면, 
                        조금 더 솔직한 의사표현이 관계의 온도를 높이는 열쇠가 될 것입니다."`
                      )}
                    </p>
                  </div>

                  {reportData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                      {/* 사용자 감정 */}
                      <div className="bg-white/80 p-8 rounded-[30px] border-2 border-rose-100 shadow-sm">
                        <h5 className="text-xl font-black text-rose-500 mb-6 flex items-center gap-2">👤 나의 감정 분석</h5>
                        <div className="space-y-4">
                          {Object.entries(reportData.userEmotionSummary).map(([emotion, count]) => {
                            const total = Object.values(reportData.userEmotionSummary).reduce((a, b) => a + b, 0);
                            const percent = Math.round((count / total) * 100);
                            const colors: Record<string, string> = { "기쁨": "bg-pink-400", "불안": "bg-purple-400", "슬픔": "bg-blue-300", "분노": "bg-red-400", "무덤덤": "bg-gray-300" };
                            return (
                              <div key={emotion} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-rose-400"><span>{emotion}</span><span>{percent}%</span></div>
                                <div className="h-3 w-full bg-rose-50 rounded-full overflow-hidden"><div className={`h-full ${colors[emotion] || "bg-rose-300"} transition-all duration-1000`} style={{ width: `${percent}%` }} /></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* 상대방 감정 */}
                      <div className="bg-white/80 p-8 rounded-[30px] border-2 border-rose-100 shadow-sm">
                        <h5 className="text-xl font-black text-rose-500 mb-6 flex items-center gap-2">{character.emoji} 상대방 감정 분석</h5>
                        <div className="space-y-4">
                          {Object.entries(reportData.partnerEmotionSummary).map(([emotion, count]) => {
                            const total = Object.values(reportData.partnerEmotionSummary).reduce((a, b) => a + b, 0);
                            const percent = Math.round((count / total) * 100);
                            const colors: Record<string, string> = { "기쁨": "bg-pink-400", "불안": "bg-purple-400", "슬픔": "bg-blue-300", "분노": "bg-red-400", "무덤덤": "bg-gray-300" };
                            return (
                              <div key={emotion} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-rose-400"><span>{emotion}</span><span>{percent}%</span></div>
                                <div className="h-3 w-full bg-rose-50 rounded-full overflow-hidden"><div className={`h-full ${colors[emotion] || "bg-rose-300"} transition-all duration-1000`} style={{ width: `${percent}%` }} /></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
                      {[
                        { label: "남성성 지표", value: reportStats.masculinity, color: "bg-rose-500" },
                        { label: "감성 섬세도", value: reportStats.sensitivity, color: "bg-pink-400" },
                        { label: "직진 본능", value: reportStats.directness, color: "bg-rose-400" },
                        { label: "경청/배려", value: reportStats.attentiveness, color: "bg-rose-300" }
                      ].map((stat, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-end px-2"><span className="text-base font-black text-rose-400">{stat.label}</span><span className="text-2xl font-black text-rose-600">{stat.value}%</span></div>
                          <div className="h-5 w-full bg-rose-100 rounded-full overflow-hidden border-2 border-rose-50"><div className={`h-full ${stat.color} transition-all duration-1000 ease-out`} style={{ width: `${stat.value}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { emoji: "👑", label: "진지하게 상담받기", sub: "1:1 프리미엄 케어", onClick: () => router.push("/counseling") },
                  { emoji: "📱", label: "카톡 내용 평가받기", sub: "대화 캡처 분석", onClick: () => router.push("/evaluation") },
                  { emoji: "🔄", label: "채팅 다시 하기", sub: "캐릭터와 계속 대화", onClick: () => router.push("/chat") }
                ].map((btn, idx) => (
                  <button key={idx} onClick={btn.onClick} className="group relative flex flex-col items-center justify-center rounded-[40px] border-8 border-rose-100 bg-white p-8 transition-all hover:scale-[1.03] active:scale-95 shadow-xl hover:border-rose-300 overflow-hidden">
                    <div className="absolute inset-0 bg-rose-50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="text-5xl mb-4 group-hover:animate-bounce relative z-10">{btn.emoji}</span>
                    <span className="text-2xl font-black text-rose-600 relative z-10 tracking-tighter">{btn.label}</span>
                    <span className="text-sm font-bold text-rose-300 mt-2 relative z-10">{btn.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
