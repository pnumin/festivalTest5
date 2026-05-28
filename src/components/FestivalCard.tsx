import React, { useState } from "react";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { FestivalItem } from "../types";
import { cleanTitle } from "../utils/helpers";
import { motion } from "motion/react";

interface FestivalCardProps {
  festival: FestivalItem;
  isSelected: boolean;
  onClick: () => void;
}

export const FestivalCard: React.FC<FestivalCardProps> = ({
  festival,
  isSelected,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const displayTitle = cleanTitle(festival.MAIN_TITLE);
  
  // Custom styling depending on the select state
  const borderClasses = isSelected
    ? "border-2 border-blue-600 bg-blue-50/60 shadow-sm"
    : "border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:bg-slate-50/30";

  return (
    <motion.div
      id={`festival-card-${festival.UC_SEQ}`}
      onClick={onClick}
      className={`group flex flex-col md:flex-row gap-4 p-4 rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden ${borderClasses}`}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Image Thumbnail Container */}
      <div className="w-full md:w-28 h-28 md:h-24 rounded-2xl overflow-hidden relative bg-slate-100 flex-shrink-0">
        {!imgError && festival.MAIN_IMG_THUMB ? (
          <img
            src={festival.MAIN_IMG_THUMB}
            alt={displayTitle}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center text-slate-450 gap-1">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="text-[9px] text-slate-400 font-bold">No Image</span>
          </div>
        )}
        
        {/* Short season or status flag option if desired, or can leave simple */}
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
          {festival.GUGUN_NM || "부산"}
        </div>
      </div>

      {/* Contents */}
      <div className="flex flex-col justify-between flex-grow min-w-0">
        <div>
          {/* Active selection check badge & Slogan */}
          <div className="flex justify-between items-start gap-2 mb-1">
            {festival.TITLE ? (
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider line-clamp-1">
                {festival.TITLE}
              </p>
            ) : (
              <span />
            )}
            {isSelected && (
              <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                ✓
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-base font-extrabold tracking-tight line-clamp-2 leading-tight ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
            {displayTitle}
          </h3>
          
          {/* Subtitle / Venue */}
          {festival.MAIN_PLACE && (
            <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate text-[11px] text-slate-500">{festival.MAIN_PLACE}</span>
            </div>
          )}
        </div>

        {/* Date / footer details */}
        {festival.USAGE_DAY_WEEK_AND_TIME && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-slate-500 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-slate-450" />
            <span className="truncate text-slate-500 text-[10px] uppercase font-bold tracking-tight">
              {festival.USAGE_DAY_WEEK_AND_TIME}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
