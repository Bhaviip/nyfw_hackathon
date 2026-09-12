import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Sparkles, FolderHeart, Check, Bookmark, ArrowRight, RotateCcw, Share2, Tag } from "lucide-react";

export default function CongratsScreen({
  outfitData,
  onSaveOutfit,
  onGoToFolders,
  onStartNewOutfit,
  onShare
}) {
  const { style, occasion, items = [] } = outfitData;
  const [editorial, setEditorial] = useState(null);
  const [isLoadingReview, setIsLoadingReview] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#ec4899", "#8b5cf6", "#3b82f6", "#f59e0b", "#10b981"],
    });

    const fetchReview = async () => {
      try {
        const response = await fetch("/api/review-outfit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style, occasion, items }),
        });
        const data = await response.json();
        if (data.review) {
          setEditorial(data.review);
        }
      } catch (err) {
        console.error("Error generating review:", err);
      } finally {
        setIsLoadingReview(false);
      }
    };

    fetchReview();
  }, []);

  const handleSave = async () => {
    await onSaveOutfit({
      styleName: style.title,
      styleId: style.id,
      occasionTag: occasion,
      items,
      editorialReview: editorial,
      createdAt: new Date().toISOString(),
    });
    setIsSaved(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-in fade-in duration-500">
      {/* Celebration Headline */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Outfit Complete!</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Congrats! <span className="bright-gradient-text">You Found Your Outfit.</span>
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto">
          Your personal wardrobe is ready to turn heads for{" "}
          <span className="text-pink-600 font-bold">{occasion}</span>.
        </p>
      </div>

      {/* Lookbook Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 shadow-xl shadow-slate-200/50 bg-white">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold">
              📁 Folder: {style.title}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              #{occasion.replace(/\s+/g, "_")}
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {items.length} Matched Pieces
          </span>
        </div>

        {/* Gallery */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Your Assembled Wardrobe Look
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 group shadow-2xs"
              >
                <div className="aspect-square bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.itemName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2.5 space-y-0.5">
                  <div className="text-[10px] font-bold uppercase text-pink-600">
                    {item.category}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {item.itemName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-3xl p-5 border border-purple-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Stylist Review</span>
          </div>

          {isLoadingReview ? (
            <div className="flex items-center gap-3 py-3 text-xs text-slate-500 font-medium">
              <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span>Drafting your outfit summary...</span>
            </div>
          ) : editorial ? (
            <div className="space-y-2.5">
              <h3 className="font-editorial text-lg font-bold text-slate-900">
                {editorial.editorialTitle || "Looking Fabulous!"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {editorial.editorialReview}
              </p>
              {editorial.masterTip && (
                <div className="pt-2 border-t border-purple-200 text-xs text-purple-900">
                  <strong className="font-bold uppercase text-[10px] block mb-0.5 text-purple-700">
                    Styling Tip:
                  </strong>
                  {editorial.masterTip}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {!isSaved ? (
            <button
              onClick={handleSave}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save to "{style.title}" Folder</span>
            </button>
          ) : (
            <button
              onClick={onGoToFolders}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Saved! View Wardrobe</span>
            </button>
          )}

          <button
            onClick={onGoToFolders}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <FolderHeart className="w-4 h-4 text-pink-500" />
            <span>My Wardrobe Folders</span>
          </button>

          <button
            onClick={onStartNewOutfit}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Style Another</span>
          </button>
        </div>
      </div>
    </div>
  );
}
