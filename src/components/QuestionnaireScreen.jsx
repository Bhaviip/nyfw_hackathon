import React, { useState } from "react";
import { Sparkles, Calendar, User, Compass, ArrowRight, Flame } from "lucide-react";

const OCCASION_PRESETS = [
  "NYFW Runway Show",
  "Fashion Week Afterparty",
  "VIP Gallery Opening",
  "SoHo Rooftop Cocktails",
  "Weekend Street Style",
  "Black Tie Gala",
  "Dinner Date Night",
  "Sunny Patio Brunch"
];

const GENDER_OPTIONS = [
  { id: "Womenswear / Chic", label: "Womenswear", sub: "Chic feminine & Pinterest silhouettes" },
  { id: "Menswear / Tailored", label: "Menswear", sub: "Clean tailoring & contemporary street style" },
  { id: "Gender-Fluid / Avant-Garde", label: "Gender-Fluid", sub: "Creative, unisex & expressive fits" },
];

export default function QuestionnaireScreen({ onSubmit, isLoading }) {
  const [occasion, setOccasion] = useState("");
  const [gender, setGender] = useState("Womenswear / Chic");
  const [age, setAge] = useState(24);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!occasion.trim()) return;
    onSubmit({ occasion: occasion.trim(), gender, age: Number(age) });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Editorial Banner */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/80 border border-pink-200 text-pink-700 text-xs font-semibold tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span>Powered by Gemini & Pinterest Trend Inspo</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Curate Your <span className="bright-gradient-text">Dream Outfit</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto font-normal">
          Tell Gemini about your event, style, and age. We'll find viral Pinterest outfit ideas and help you build the look using pieces already inside your closet!
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 space-y-7 shadow-xl shadow-slate-200/50 border border-slate-200">
        
        {/* 1. Occasion / Event */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-500" />
              1. What event or occasion are you going to?
            </span>
            <span className="text-[11px] text-slate-400 lowercase font-normal">required</span>
          </label>
          <input
            type="text"
            required
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="e.g. NYFW Runway Front Row, Summer Rooftop Party, Art Gala..."
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all shadow-inner"
          />

          {/* Quick presets */}
          <div className="pt-2">
            <p className="text-[11px] text-slate-500 font-medium mb-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Popular Inspo:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OCCASION_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setOccasion(preset)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    occasion === preset
                      ? "bg-pink-500 border-pink-500 text-white font-semibold shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Gender / Silhouette */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-500" />
            2. Fashion Silhouette
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {GENDER_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setGender(opt.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  gender === opt.id
                    ? "bg-purple-50 border-purple-400 text-purple-950 shadow-sm shadow-purple-500/10 ring-2 ring-purple-400/20"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-slate-900">{opt.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Age */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-500" />
              3. Age
            </span>
            <span className="text-sm font-bold text-indigo-600">{age} years old</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={16}
              max={80}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-pink-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              min={14}
              max={99}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-16 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm font-bold text-slate-900 focus:border-pink-500 outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !occasion.trim()}
          className="w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2.5"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Gemini is Finding Pinterest Inspo...</span>
            </>
          ) : (
            <>
              <span>Find Outfit Styles</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
