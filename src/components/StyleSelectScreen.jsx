import React, { useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  ArrowRight, 
  Shirt, 
  ExternalLink,
  Camera
} from "lucide-react";

export default function StyleSelectScreen({
  styles = [],
  currentRollIndex = 0,
  totalRolls = 1,
  onPrevRoll,
  onNextRoll,
  onReroll,
  onSelectStyle,
  userCriteria,
  onEditCriteria,
  isLoading
}) {
  const [preferences, setPreferences] = useState("");

  const handleRefineSubmit = (e) => {
    e.preventDefault();
    if (!preferences.trim()) return;
    onReroll(preferences.trim());
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-600 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Pinterest & Gemini Outfit Inspo</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pick Your <span className="bright-gradient-text">Favorite Style</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold text-slate-800">
              {userCriteria.occasion}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              {userCriteria.gender}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              Age {userCriteria.age}
            </span>
            <button
              onClick={onEditCriteria}
              className="text-pink-600 hover:text-pink-700 font-semibold ml-1 hover:underline text-xs"
            >
              Edit Criteria
            </button>
          </div>
        </div>

        {/* Roll Navigation & Reroll Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {totalRolls > 1 && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs">
              <button
                onClick={onPrevRoll}
                disabled={currentRollIndex === 0}
                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100"
                title="Previous Roll"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-700 font-mono">
                Roll {currentRollIndex + 1} of {totalRolls}
              </span>
              <button
                onClick={onNextRoll}
                disabled={currentRollIndex === totalRolls - 1}
                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100"
                title="Next Roll"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => onReroll(preferences)}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold tracking-wide flex items-center gap-2 shadow-xs transition-all hover:border-pink-300 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-500 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Finding Inspo..." : "Reroll Styles"}</span>
          </button>
        </div>
      </div>

      {/* User Preferences Refinement Box (As requested) */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-200 bg-white shadow-md shadow-slate-200/40">
        <form onSubmit={handleRefineSubmit} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-pink-500" />
              Want to customize your styles further?
            </label>
            <span className="text-[11px] text-slate-400 font-medium">optional preference</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. 'Must include sneakers', 'Keep it mostly black', 'No skirts, casual vibes'..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 text-slate-900 placeholder-slate-400 text-xs sm:text-sm outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !preferences.trim()}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold whitespace-nowrap shadow-sm shadow-pink-500/20 disabled:opacity-40 disabled:pointer-events-none hover:opacity-95 transition-all"
            >
              Refine Styles
            </button>
          </div>
        </form>
      </div>

      {/* 3 Styles Grid with Visual Images & Simple Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {styles.map((style, index) => (
          <div
            key={style.id || index}
            className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-slate-200 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 group bg-white"
          >
            <div>
              {/* Visual Outfit Image Example */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={style.imageUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"}
                  alt={style.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                
                {/* Top Badge Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold shadow-xs">
                    Style 0{index + 1}
                  </span>
                  
                  {style.pinterestUrl && (
                    <a
                      href={style.pinterestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pointer-events-auto px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md hover:bg-red-700 transition-all"
                      title="See Pinterest moodboard pins"
                    >
                      <span>Pinterest Inspo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Title & Simple Tagline */}
                <div>
                  <h3 className="font-editorial text-xl font-bold text-slate-900 group-hover:text-pink-600 transition-colors leading-snug">
                    {style.title}
                  </h3>
                  <p className="text-xs font-semibold text-pink-600 mt-1">
                    {style.tagline}
                  </p>
                </div>

                {/* Simple Description (Clean & Accessible) */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {style.vibeDescription || style.simpleDescription}
                </p>

                {/* Color Palette */}
                {style.colorPalette && style.colorPalette.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Color Vibe
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {style.colorPalette.map((color, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Wardrobe Checklist with Examples */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5 text-pink-500" /> Items to Find in Your Closet:
                  </div>
                  <div className="space-y-1.5">
                    {style.keyPieces?.map((piece, pIdx) => (
                      <div key={pIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-0.5">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>{piece.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-slate-500 border border-slate-200">
                            {piece.category}
                          </span>
                        </div>
                        {piece.examples && piece.examples.length > 0 && (
                          <div className="text-[11px] text-slate-500">
                            e.g. {piece.examples.slice(0, 2).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Styling Tip */}
                {style.stylingTips && style.stylingTips.length > 0 && (
                  <div className="text-[11px] text-slate-700 bg-amber-50 p-3 rounded-2xl border border-amber-200/60">
                    <strong className="text-amber-800 font-bold block text-[10px] uppercase mb-0.5">
                      Stylist Tip:
                    </strong>
                    {style.stylingTips[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Select Button */}
            <div className="p-6 pt-0">
              <button
                onClick={() => onSelectStyle(style)}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md shadow-pink-500/20 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                <span>Select & Scan Wardrobe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
