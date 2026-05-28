import React, { useState, useEffect } from "react";
import { 
  X, MapPin, Calendar, Clock, Utensils, Info, Sparkles, Navigation, 
  Copy, Check, Compass, Share2, RefreshCw, CompassIcon, AlertTriangle
} from "lucide-react";
import { FestivalItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cleanTitle } from "../utils/helpers";

interface TravelPlanData {
  festivalOverview: string;
  nearbyAttractions: Array<{
    name: string;
    description: string;
    distance: string;
    category: string;
  }>;
  foodRecommendations: Array<{
    name: string;
    menu: string;
    description: string;
    reason: string;
  }>;
  itinerary: Array<{
    timeSlot: string;
    activity: string;
    tip: string;
  }>;
  localTip: string;
}

interface TravelPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  festival: FestivalItem;
}

export const TravelPlannerModal: React.FC<TravelPlannerModalProps> = ({
  isOpen,
  onClose,
  festival,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TravelPlanData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const displayTitle = cleanTitle(festival.MAIN_TITLE);

  // Cycling funny and engaging loading messages for the AI generation
  useEffect(() => {
    if (!loading) return;

    const messages = [
      "부산 AI 토박이가 가상 지도를 훑어보는 중입니다...",
      "축제장 근처 지하철역 및 도보 동선을 분석하는 중...",
      "해당 동네에서 가장 평점 높은 진짜 현지인 맛집을 골라내는 중...",
      "바다소리에 어울리는 최적의 힐링 일정을 엮는 중...",
      "피크타임 대기 완화를 위한 특급 꼼수를 적용하는 중..."
    ];

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % messages.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [loading]);

  const fetchTravelPlan = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ festival }),
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류 (상태코드: ${response.status})`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setPlan(data);
    } catch (err: any) {
      console.error("[TravelPlannerModal] Error fetching plan:", err);
      setError(err.message || "여행 일정을 생성하는 중에 예기치 못한 우려가 생겼습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch plan automatically when modal opens and we don't have it yet
  useEffect(() => {
    if (isOpen && festival) {
      fetchTravelPlan();
    } else {
      // Clear plan when opening a different festival
      setPlan(null);
    }
  }, [isOpen, festival.UC_SEQ]);

  const handleCopyText = () => {
    if (!plan) return;

    const formattedText = `
[🌊 ${displayTitle} & 부산 당일치기 코스 추천]

📍 축제 한눈에 요약:
"${plan.festivalOverview}"

🗓️ 시간대별 당일 일정:
${plan.itinerary.map((item) => `- ${item.timeSlot}: ${item.activity}\n  (💡 팁: ${item.tip})`).join("\n\n")}

🏞️ 주변 원픽 관광지:
${plan.nearbyAttractions.map((att) => `- ${att.name} [${att.category}] (${att.distance})\n  : ${att.description}`).join("\n\n")}

🍛 강력 추천 로컬 맛집:
${plan.foodRecommendations.map((food) => `- ${food.name} (추천 메뉴: ${food.menu})\n  : ${food.description}\n  *추천 이유: ${food.reason}`).join("\n\n")}

⛵ 부산 토박이의 꿀팁:
${plan.localTip}

---
*부산 축제 가이드 AI Travel Planner*
    `.trim();

    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadingMessages = [
    "부산 AI 토박이가 가상 지도를 훑어보는 중입니다...",
    "축제장 근처 지하철역 및 도보 동선을 분석하는 중...",
    "해당 동네에서 가장 평점 높은 진짜 현지인 맛집을 골라내는 중...",
    "바다소리에 어울리는 최적의 힐링 일정을 엮는 중...",
    "피크타임 대기 완화를 위한 특급 꼼수를 적용하는 중..."
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="bg-[#F8FAFC] border border-slate-200 rounded-[28px] md:rounded-[36px] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 md:p-6 flex justify-between items-center flex-shrink-0 relative">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase">AI Travel Suggestion</span>
                  <h3 className="text-sm md:text-base font-black truncate max-w-[250px] md:max-w-[450px]">
                    🌊 {displayTitle} 맞춤 여행 일정표
                  </h3>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors focus:ring-2 focus:ring-blue-500"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inner Content Panel */}
            <div className="flex-grow overflow-y-auto p-5 md:p-8 space-y-6 scrollbar-thin">
              {loading ? (
                /* Dynamic Loading Spinner */
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center px-4 space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                    <CompassIcon className="absolute inset-4 text-blue-600 w-8 h-8 animate-pulse-slow" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <p className="text-sm font-extrabold text-slate-800 animate-pulse">
                      스마트 루트 생성중
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold">
                      {loadingMessages[loadingStep]}
                    </p>
                  </div>
                </div>
              ) : error ? (
                /* ERROR UI State */
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-650">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-sm font-extrabold text-red-950">AI 서비스 요청 오류</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={fetchTravelPlan}
                    className="flex items-center gap-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 py-2.5 px-6 rounded-full shadow-sm hover:scale-[1.01] transition-transform"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    다시 시도하기
                  </button>
                </div>
              ) : plan ? (
                /* ACTUAL RECOMMENDATION RECOMMENDATION DATA UI */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Festival Overview Card */}
                  <div className="border border-blue-250 bg-blue-50/40 p-5 rounded-3xl">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-1">RECOMMENDED THEME</span>
                    <h4 className="text-base font-extrabold text-blue-900 leading-relaxed">
                      "{plan.festivalOverview}"
                    </h4>
                  </div>

                  {/* Split Grid for Timeline vs Attractions */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Left Panel: 1-Day Itinerary Tracking Component (7 columns) */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[28px] p-5 md:p-6 shadow-sm flex flex-col">
                      <div className="flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-3">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <h4 className="text-sm font-black text-slate-800">RECOMMENDED ITINERARY · 추천 당일 코스</h4>
                      </div>

                      {/* Course Lists with nice line divider */}
                      <div className="space-y-5 relative pl-4 border-l-2 border-slate-100 py-1">
                        {plan.itinerary.map((item, idx) => (
                          <div key={idx} className="relative group">
                            {/* Dot element on left */}
                            <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50/50 group-hover:scale-110 transition-transform" />
                            
                            <h5 className="text-[11px] font-black text-slate-450 uppercase tracking-wider">{item.timeSlot}</h5>
                            <h4 className="text-sm font-extrabold text-slate-800 mt-0.5 leading-snug">{item.activity}</h4>
                            <div className="flex items-start gap-1 mt-1 bg-slate-50 p-2 rounded-xl border border-slate-100/60">
                              <Info className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-slate-500 font-bold leading-normal">{item.tip}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Panel: Nearby Places Bento box list (5 columns) */}
                    <div className="lg:col-span-5 space-y-4">
                      
                      {/* Attractions Header */}
                      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NEARBY SIGHTS</span>
                        <h4 className="text-base font-black mt-1 leading-tight">주변 최고 명소 추천</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                          축제 전후 자투리 시간을 완벽하게 보내는 근처 꼭 가볼 만한 곳들입니다.
                        </p>
                      </div>

                      {/* Attractions List */}
                      {plan.nearbyAttractions.map((sight, idx) => (
                        <div 
                          key={idx}
                          className="bg-white border border-slate-250 rounded-[22px] p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-1.5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg uppercase tracking-tight">
                              {sight.category}
                            </span>
                            <span className="text-[9px] text-slate-450 font-black shrink-0">
                              🚗 {sight.distance}
                            </span>
                          </div>
                          <h5 className="text-sm font-extrabold text-slate-800 mt-1.5 leading-none">{sight.name}</h5>
                          <p className="text-xs text-slate-500 mt-1.5 font-semibold leading-relaxed">
                            {sight.description}
                          </p>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Food Recommendations Bento Piece */}
                  <div className="bg-white border border-slate-200 rounded-[28px] p-5 md:p-6 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-3">
                      <Utensils className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-black text-slate-800 uppercase">LOCAL DINING SPECIALS · 강력 추천 로컬 먹거리</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.foodRecommendations.map((food, idx) => (
                        <div 
                          key={idx}
                          className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 mb-0.5 block">강력 추천 현지식당 / 음식</span>
                            <h5 className="text-base font-black text-slate-800 leading-none">{food.name}</h5>
                            <p className="text-xs text-slate-550 font-bold mt-1.5">대표메뉴: <span className="text-blue-600 font-extrabold">{food.menu}</span></p>
                            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{food.description}</p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex gap-1.5 items-start">
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded shrink-0">추천사유</span>
                            <p className="text-[10px] text-slate-600 font-semibold leading-snug">{food.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Local insider safety & utility tips */}
                  <div className="bg-slate-950 text-white rounded-[28px] p-5 md:p-6 shadow-md flex items-start gap-4">
                    <div className="p-2-5 bg-white/10 text-yellow-400 rounded-2xl shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">LOCAL MASTER CONCIERGE TIP</span>
                      <h4 className="text-sm font-black text-yellow-400 uppercase leading-none mb-1">
                        부산 토박이 기획 전문가의 극락 편의 팁
                      </h4>
                      <p className="text-xs text-slate-300 font-semibold leading-relaxed whitespace-pre-line">
                        {plan.localTip}
                      </p>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="h-full min-h-[300px] flex items-center justify-center">
                  <p className="text-slate-400 text-sm">정보를 준비하고 있습니다...</p>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Footer */}
            {!loading && plan && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                  * 추천 명소나 식당은 축제 기획사 및 로컬 기행 실측 바탕의 제안입니다.
                </span>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  {/* Copy itinerary */}
                  <button
                    onClick={handleCopyText}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-black text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 py-3 px-5 rounded-full transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        일정 클립보드 복사완료
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        일정 클립보드 복사
                      </>
                    )}
                  </button>

                  {/* Regenerate advice */}
                  <button
                    onClick={fetchTravelPlan}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 py-3 px-5 rounded-full shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    새로운 코스 재생성
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
