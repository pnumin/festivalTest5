import { useEffect, useState, useMemo } from "react";
import { 
  Compass, Search, MapPin, Calendar, HelpCircle, 
  RotateCcw, Sparkles, SlidersHorizontal, ArrowLeft, Anchor
} from "lucide-react";
import { FestivalItem, FestivalResponse } from "./types";
import { FestivalCard } from "./components/FestivalCard";
import { FestivalDetails } from "./components/FestivalDetails";
import { cleanTitle, matchesSeason } from "./utils/helpers";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for search and filtering
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [selectedFestivalId, setSelectedFestivalId] = useState<number | null>(null);

  // Fetch festivals from API
  const fetchFestivals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/festivals");
      if (!response.ok) {
        throw new Error(`서버 응답 오류 (상태코드: ${response.status})`);
      }
      const data: FestivalResponse = await response.json();
      
      if (data && data.getFestivalKr && data.getFestivalKr.item) {
        setFestivals(data.getFestivalKr.item);
        
        // Auto-select first item on desktop
        if (data.getFestivalKr.item.length > 0 && window.innerWidth >= 768) {
          setSelectedFestivalId(data.getFestivalKr.item[0].UC_SEQ);
        }
      } else {
        throw new Error("올바르지 않은 API 응답 형식입니다.");
      }
    } catch (err: any) {
      console.error("Festival fetch error:", err);
      setError(err.message || "축제 정보를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals();
  }, []);

  // Filter lists dynamically using memo tools
  const filteredFestivals = useMemo(() => {
    return festivals.filter((item) => {
      // 1. Search Query filter (matches Title, slogans, and description content)
      const keyword = searchQuery.toLowerCase().trim();
      const matchSearch =
        !keyword ||
        item.MAIN_TITLE.toLowerCase().includes(keyword) ||
        (item.TITLE && item.TITLE.toLowerCase().includes(keyword)) ||
        (item.PLACE && item.PLACE.toLowerCase().includes(keyword)) ||
        (item.ITEMCNTNTS && item.ITEMCNTNTS.toLowerCase().includes(keyword));

      // 2. District filter
      const matchDistrict =
        selectedDistrict === "all" || item.GUGUN_NM === selectedDistrict;

      // 3. Season filter
      const matchSeasonState = matchesSeason(item.USAGE_DAY_WEEK_AND_TIME, selectedSeason);

      return matchSearch && matchDistrict && matchSeasonState;
    });
  }, [festivals, searchQuery, selectedDistrict, selectedSeason]);

  // Extract unique districts (gugun) present in the original dataset
  const districts = useMemo(() => {
    const list = festivals
      .map((item) => item.GUGUN_NM)
      .filter((name): name is string => typeof name === "string" && name.trim().length > 0);
    return ["all", ...Array.from(new Set(list))];
  }, [festivals]);

  // Find the currently selected item object
  const selectedFestival = useMemo(() => {
    return festivals.find((f) => f.UC_SEQ === selectedFestivalId) || null;
  }, [festivals, selectedFestivalId]);

  // Reset all filters easily
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDistrict("all");
    setSelectedSeason("all");
    if (festivals.length > 0 && window.innerWidth >= 768) {
      setSelectedFestivalId(festivals[0].UC_SEQ);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-blue-500/10 selection:text-blue-950">
      
      {/* 🌊 Bento Styled Global Header */}
      <header className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-6 pb-2 flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black tracking-wider rounded-lg uppercase">
              Busan Data Portal API
            </span>
          </div>
          <h1 className="text-3xl md:text-4.5xl font-black tracking-tighter text-blue-600 flex items-center gap-2 leading-none">
            BUSAN FESTIVAL EXPLORER
            <span className="text-slate-800 font-black text-xl md:text-2xl hidden sm:inline">| 부산 축제 가이드</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            Discover the vibrant culture of Korea's beautiful coastal gem in real-time.
          </p>
        </div>

        {/* Season Filter Pills built into the right side header (as indicated in Design HTML!) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "ALL SEASONS 🌈" },
            { id: "spring", label: "SPRING 🌸" },
            { id: "summer", label: "SUMMER ☀️" },
            { id: "autumn", label: "AUTUMN 🍁" },
            { id: "winter", label: "WINTER ❄️" },
          ].map((season) => {
            const isActive = selectedSeason === season.id;
            return (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.id)}
                className={`px-3-5 py-1.5 rounded-full text-[11px] font-black tracking-tight transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-350"
                }`}
              >
                {season.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto w-full flex-grow p-4 md:p-6 flex flex-col md:flex-row gap-5 min-h-0">
        
        {/* LEFT COLUMN: Filters + Scrollable Festival List */}
        <div id="festival-list-section" className="w-full md:w-5/12 lg:w-4/12 flex flex-col gap-4 flex-shrink-0 min-h-0">
          
          {/* 🔍 Search & Filter controls */}
          <div className="bg-white border border-slate-200 p-5 rounded-[32px] shadow-sm space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="축제목록 검색 (이름, 슬로건 등)..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-450 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded font-mono"
                >
                  ESC
                </button>
              )}
            </div>

            {/* District Filtering Options (Dropdown + Quick badges) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-450 tracking-wider flex items-center gap-1 uppercase">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                DISTRICT / 지역구 필터
              </label>
              
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">전체 부산 지역구</option>
                  {districts
                    .filter((d) => d !== "all")
                    .sort((a, b) => a.localeCompare(b, "ko"))
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
                <div className="absolute right-3 top-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 w-0 h-0"></div>
              </div>

              {/* Hot local tags quick filter */}
              <div className="flex flex-wrap gap-1 mt-1">
                {["all", "해운대구", "수영구", "영도구", "동래구"].map((shortcut) => {
                  if (districts.includes(shortcut)) {
                    return (
                      <button
                        key={shortcut}
                        onClick={() => setSelectedDistrict(shortcut)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                          selectedDistrict === shortcut
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {shortcut === "all" ? "전체 지역" : shortcut}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* List Action Footer (Status message + Reset) */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] text-slate-655 font-bold">
              <span className="uppercase">
                CONDITIONS MATCH: <span className="text-blue-600 font-extrabold">{filteredFestivals.length}</span>
              </span>
              {(searchQuery || selectedDistrict !== "all" || selectedSeason !== "all") && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-black hover:underline transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  RESET ALL
                </button>
              )}
            </div>
          </div>

          {/* 🎪 Festival Scrollable List */}
          <div className="flex-grow overflow-y-auto pr-1 space-y-3 max-h-[480px] md:max-h-[calc(100vh-420px)] min-h-[220px] scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center space-y-3 py-16 bg-white border border-slate-200 rounded-3xl">
                <div className="animate-spin rounded-full h-7 w-7 border-4 border-blue-550 border-t-transparent shadow-sm"></div>
                <p className="text-xs font-bold text-slate-650">부산 축제 정보 불러오는 중...</p>
                <p className="text-[10px] text-slate-400">데이터 포털 통신 대기 중</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="font-extrabold text-red-950 text-sm">데이터 수신 대기오류</h4>
                <p className="text-[11px] text-red-700 line-clamp-2 leading-relaxed">
                  {error}
                </p>
                <button
                  onClick={fetchFestivals}
                  className="mx-auto flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-red-650 hover:bg-red-750 py-2 px-4 rounded-full cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  RETRY CONNECTION
                </button>
              </div>
            ) : filteredFestivals.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl py-14">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">조건 필터에 부합하는 축제가 없습니다</p>
                <p className="text-[10px] text-slate-400 mt-1">질의어나 선택 구군을 수정해 보시기 바랍니다.</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold bg-slate-900 text-white rounded-xl py-2 px-3.5 hover:bg-black transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  FILTER RESET
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFestivals.map((festival) => (
                  <FestivalCard
                    key={festival.UC_SEQ}
                    festival={festival}
                    isSelected={selectedFestivalId === festival.UC_SEQ}
                    onClick={() => setSelectedFestivalId(festival.UC_SEQ)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bento boxes for Weather and Quick Stats (as shown in Design HTML!) */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {/* Weather Box */}
            <div className="bg-slate-900 text-white rounded-[24px] p-4 flex flex-col justify-between aspect-video min-h-[100px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">BUSAN CLIMATE</span>
              <div className="flex items-end justify-between leading-none mt-1">
                <span className="text-3xl font-black tracking-tighter">24°C</span>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-400">오션 브리즈</p>
                  <p className="text-[8px] opacity-60">맑음 / 습도 58%</p>
                </div>
              </div>
            </div>

            {/* Selected Festival Quick coordinates snapshot Map snapshot Box */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-4 flex flex-col justify-between aspect-video min-h-[100px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MAP COORDINATES</span>
              <div className="mt-1 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping shrink-0" />
                <span className="text-[10px] font-bold text-slate-700 truncate">
                  {selectedFestival ? selectedFestival.MAIN_PLACE || selectedFestival.GUGUN_NM : "부산 전역"}
                </span>
              </div>
              <div className="text-[8px] text-slate-450 font-mono tracking-tight font-bold">
                {selectedFestival && selectedFestival.LAT ? `LAT: ${selectedFestival.LAT.toFixed(4)}` : "35.1798° N"}, {selectedFestival && selectedFestival.LNG ? `LNG: ${selectedFestival.LNG.toFixed(4)}` : "129.0750° E"}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Details Desk / responsive slide overlay */}
        <div id="festival-details-section" className="w-full md:w-7/12 lg:w-8/12 flex-grow min-y-0 h-full hidden md:block">
          <FestivalDetails
            festival={selectedFestival}
            onClose={() => setSelectedFestivalId(null)}
          />
        </div>

        {/* Mobile drawer detail slide */}
        <AnimatePresence>
          {selectedFestivalId !== null && window.innerWidth < 768 && (
            <motion.div
              id="mobile-detail-overlay animate"
              className="fixed inset-y-0 inset-x-0 z-50 bg-white"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
              {/* Back button for mobile users */}
              <div className="bg-slate-950 p-3 flex items-center justify-start text-white border-b border-white/10 gap-2">
                <button
                  onClick={() => setSelectedFestivalId(null)}
                  className="flex items-center gap-1 text-[11px] font-black text-blue-400 bg-white/15 hover:bg-white/25 hover:text-white px-3.5 py-1.5 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4" />
                  목록으로 돌아가기
                </button>
              </div>
              <div className="h-[calc(100vh-50px)] overflow-hidden">
                <FestivalDetails
                  festival={selectedFestival}
                  onClose={() => setSelectedFestivalId(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 py-6 px-6 md:px-12 flex-shrink-0 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-slate-400 gap-4">
        <div className="flex gap-4">
          <span>SOURCE: BUSAN PUBLIC DATA PORTAL</span>
          <span>LAST UPDATED: 2026-05-28</span>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-[9px]">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>SERVICE CONNECTED / KOREA OPEN DATA</span>
        </div>
      </footer>
    </div>
  );
}
