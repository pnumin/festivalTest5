import React, { useState } from "react";
import { 
  X, MapPin, Calendar, Phone, CreditCard, Compass, ExternalLink, 
  Copy, Check, Navigation, Info, Award, Train, Bus
} from "lucide-react";
import { FestivalItem } from "../types";
import { cleanTitle } from "../utils/helpers";
import { motion, AnimatePresence } from "motion/react";

interface FestivalDetailsProps {
  festival: FestivalItem | null;
  onClose: () => void;
}

export const FestivalDetails: React.FC<FestivalDetailsProps> = ({
  festival,
  onClose,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!festival) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-25/50 border border-dashed border-slate-200 rounded-3xl">
        <Compass className="w-12 h-12 text-slate-300 animate-spin-slow mb-3" />
        <p className="text-sm font-semibold text-slate-600">축제를 선택해 주세요</p>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
          왼쪽 목록에서 보고 싶은 부산의 축제를 클릭하면 상세한 정보를 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  const title = cleanTitle(festival.MAIN_TITLE);
  const fullAddress = [festival.ADDR1, festival.ADDR2].filter(Boolean).join(" ").trim() || festival.MAIN_PLACE;

  // Handle address copying
  const handleCopyAddress = () => {
    if (!fullAddress) return;
    navigator.clipboard.writeText(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Generate directions URL (Naver or Kakao map search with coordinates, or Google Map as fallback)
  const mapSearchUrl = festival.LAT && festival.LNG
    ? `https://map.kakao.com/link/map/${encodeURIComponent(title)},${festival.LAT},${festival.LNG}`
    : `https://map.kakao.com/link/search/${encodeURIComponent(fullAddress || title)}`;

  // Parse paragraphs from description to render elegantly instead of a giant unformatted block
  const paragraphs = festival.ITEMCNTNTS
    ? festival.ITEMCNTNTS
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];

  return (
    <div id="festival-details-panel" className="bg-white border border-slate-250 rounded-[32px] md:rounded-[40px] shadow-sm overflow-hidden h-full flex flex-col">
      {/* Detail Panel Header (Fixed on Desktop, responsive on scroll) */}
      <div className="relative h-60 md:h-64 w-full bg-slate-950 flex-shrink-0">
        {!imgError && festival.MAIN_IMG_NORMAL ? (
          <img
            src={festival.MAIN_IMG_NORMAL}
            alt={title}
            className="w-full h-full object-cover opacity-85"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Compass className="w-10 h-10 text-blue-500 opacity-60 animate-bounce" />
            <span className="text-xs text-slate-450 font-bold">아름다운 축제 이미지를 불러오는 중입니다</span>
          </div>
        )}
        
        {/* Soft Shadow Gradient Over Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 md:p-8">
          <div className="flex flex-wrap gap-1.5 mb-2.5 items-center">
            {festival.GUGUN_NM && (
              <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-tight shadow-sm uppercase">
                {festival.GUGUN_NM}
              </span>
            )}
            {festival.USAGE_DAY_WEEK_AND_TIME && (
              <span className="bg-white/10 backdrop-blur-md text-slate-100 border border-white/20 text-[10px] px-3 py-1 rounded-full font-bold uppercase">
                {festival.USAGE_DAY_WEEK_AND_TIME}
              </span>
            )}
          </div>
          
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter drop-shadow-sm leading-tight uppercase">
            {title}
          </h2>
          {festival.SUBTITLE && (
            <p className="text-xs md:text-sm text-sky-200 mt-1 font-bold tracking-tight opacity-90 line-clamp-1">
              {festival.SUBTITLE}
            </p>
          )}
        </div>

        {/* Floating Close Button for Mobile Drawer layout */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2.5 rounded-full border border-white/10 transition-colors focus:ring-2 focus:ring-blue-500"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Detail Content (Scrollable Container) */}
      <div className="flex-grow overflow-y-auto p-5 md:p-8 space-y-5 scrollbar-thin">
        
        {/* Slogan Intro */}
        {festival.TITLE && (
          <div className="border border-blue-250 bg-blue-50/40 p-5 rounded-3xl">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              Active Concept Slogan
            </h4>
            <p className="text-base font-extrabold text-blue-900 mt-1 leading-snug">
              "{festival.TITLE}"
            </p>
          </div>
        )}

        {/* Split Details Grid as distinct Bento boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Main place Bento Piece */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VENUE & LOCATION</span>
            <div className="mt-2 min-w-0">
              <h4 className="text-lg font-black text-slate-800 leading-tight truncate">{festival.MAIN_PLACE || "미지정"}</h4>
              {fullAddress && (
                <div className="flex items-center gap-1.5 mt-1.5 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                  <span className="text-xs text-slate-500 truncate flex-grow leading-none font-semibold">{fullAddress}</span>
                  <button 
                    onClick={handleCopyAddress}
                    className="text-blue-600 hover:text-blue-800 p-1 bg-white border border-slate-200 rounded-lg transition-colors flex-shrink-0"
                    title="주소 복사"
                  >
                    {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fee details block (Dark Bento piece for high visual contrast!) */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ADMISSION FEE</span>
            <div className="mt-2">
              <h4 className="text-lg font-black text-emerald-400 leading-tight">{festival.USAGE_AMOUNT || "무료입장"}</h4>
              <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                공식 프로그램 및 일부 유료 체험 행사를 제외하고 상시 자유 관람이 가능합니다.
              </p>
            </div>
          </div>

          {/* Contact phone Bento Piece */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CONTACT / TELEPHONE</span>
            <div className="mt-2">
              {festival.CNTCT_TEL ? (
                <a 
                  href={`tel:${festival.CNTCT_TEL}`}
                  className="text-lg font-black text-blue-600 hover:underline flex items-center gap-1"
                >
                  {festival.CNTCT_TEL}
                </a>
              ) : (
                <h4 className="text-lg font-black text-slate-800">정보 없음</h4>
              )}
              <p className="text-xs text-slate-450 mt-1 font-semibold">부산 축제 기획처 또는 지자체 관할 문의전화 번호입니다.</p>
            </div>
          </div>

          {/* Times Bento Piece */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between hover:border-blue-300 transition-colors">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">USAGE SCHEDULE</span>
            <div className="mt-2">
              <h4 className="text-sm font-black text-slate-800 leading-normal line-clamp-1">
                {festival.USAGE_DAY_WEEK_AND_TIME || "일정 공지대기"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-normal">
                {festival.USAGE_DAY ? festival.USAGE_DAY : "개최기간 임박 시 상세 타임테이블이 고지됩니다."}
              </p>
            </div>
          </div>
        </div>

        {/* Traffic Information (Transit Transit) */}
        {festival.TRFC_INFO && (
          <div className="p-5 border border-slate-200 bg-white rounded-3xl">
            <h4 className="text-[11px] font-black text-slate-500 tracking-wider flex items-center gap-1.5 mb-2.5">
              <Train className="w-4 h-4 text-slate-450" />
              대중교통 오시는 길 (TRAFFIC SERVICE)
            </h4>
            <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-line font-bold">
              {festival.TRFC_INFO}
            </p>
          </div>
        )}

        {/* Remarks Information */}
        {festival.MIDDLE_SIZE_RM1 && (
          <div className="p-5 bg-amber-50/20 border border-amber-200 rounded-3xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-900 tracking-wide uppercase">
                중요 참고 및 편의시설 팁 (GUIDE REMARKS)
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed font-semibold">
                {festival.MIDDLE_SIZE_RM1}
              </p>
            </div>
          </div>
        )}

        {/* Detailed Long Description */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2 uppercase tracking-tight">
            축제 소개 및 상세 스토리
          </h4>
          {paragraphs.length > 0 ? (
            <div className="space-y-4">
              {paragraphs.map((para, idx) => (
                <p key={idx} className="text-sm text-slate-600 leading-relaxed text-justify font-semibold">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-450 italic">상세 텍스트 설명이 공란입니다.</p>
          )}
        </div>
      </div>

      {/* Action CTA Buttons in footer (Fixed bottom) */}
      <div className="p-5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row gap-3 flex-shrink-0">
        {/* Directions Search */}
        <a
          href={mapSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 text-white font-black text-xs uppercase py-3.5 px-5 rounded-full shadow-sm transition-all hover:scale-[1.01]"
        >
          <Navigation className="w-4 h-4" />
          길찾기 (카카오맵)
        </a>

        {/* Homepage Direct button */}
        {festival.HOMEPAGE_URL && festival.HOMEPAGE_URL !== "http://" ? (
          <a
            href={festival.HOMEPAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase py-3.5 px-5 rounded-full shadow-sm transition-all hover:scale-[1.01]"
          >
            <ExternalLink className="w-4 h-4" />
            공식 홈페이지 이동
          </a>
        ) : (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-450 font-bold text-xs py-3.5 px-5 rounded-full cursor-not-allowed"
          >
            공식 홈페이지 대기
          </button>
        )}
      </div>
    </div>
  );
};
