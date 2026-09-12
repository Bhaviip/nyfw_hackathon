import React from "react";
import { Sparkles, FolderHeart, Share2 } from "lucide-react";

export default function Header({ currentScreen, onNavigate, savedCount = 0, onReset, onShare }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 text-left group transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white font-editorial font-black text-lg shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
            A
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial tracking-tight font-extrabold text-base text-slate-900">
                ATELIER
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200 font-bold">
                Pinterest AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 tracking-wide font-medium">
              Wardrobe & Outfit Stylist
            </p>
          </div>
        </button>

        {/* Navigation & Share */}
        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
              title="Share App"
            >
              <Share2 className="w-3.5 h-3.5 text-pink-500" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          <button
            onClick={() => onNavigate("questionnaire")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentScreen !== "wardrobe_folders"
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm shadow-pink-500/25"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Style</span> Studio
          </button>

          <button
            onClick={() => onNavigate("wardrobe_folders")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
              currentScreen === "wardrobe_folders"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5 text-pink-500" />
            <span>Wardrobe</span>
            {savedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-pink-500 text-white ml-0.5">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
