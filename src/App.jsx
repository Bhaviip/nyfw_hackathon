import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import QuestionnaireScreen from "./components/QuestionnaireScreen";
import StyleSelectScreen from "./components/StyleSelectScreen";
import CameraScannerScreen from "./components/CameraScannerScreen";
import CongratsScreen from "./components/CongratsScreen";
import WardrobeFoldersScreen from "./components/WardrobeFoldersScreen";

const LOCAL_STORAGE_KEY = "nyfw_wardrobe_outfits";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("questionnaire");

  const [userCriteria, setUserCriteria] = useState({
    occasion: "",
    gender: "Womenswear / Chic",
    age: 24,
  });

  const [rollsHistory, setRollsHistory] = useState([]);
  const [currentRollIndex, setCurrentRollIndex] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [completedOutfitData, setCompletedOutfitData] = useState(null);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [shareToast, setShareToast] = useState(null);

  useEffect(() => {
    fetchSavedOutfits();
  }, []);

  const fetchSavedOutfits = async () => {
    try {
      const res = await fetch("/api/outfits");
      if (res.ok) {
        const data = await res.json();
        if (data.outfits) {
          setSavedOutfits(data.outfits);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.outfits));
          return;
        }
      }
    } catch (err) {
      console.warn("Server outfits fetch failed, loading from localStorage:", err);
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        setSavedOutfits(JSON.parse(cached));
      } catch (e) {}
    }
  };

  const handleQuestionnaireSubmit = async (criteria) => {
    setUserCriteria(criteria);
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      const data = await res.json();
      if (data.styles && data.styles.length > 0) {
        const firstRoll = {
          rollIndex: 0,
          styles: data.styles,
          preferences: "",
        };
        setRollsHistory([firstRoll]);
        setCurrentRollIndex(0);
        setCurrentScreen("styles");
      } else {
        throw new Error(data.error || "Failed to generate styles");
      }
    } catch (err) {
      console.error("Error fetching styles:", err);
      setErrorBanner("Could not load styles. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReroll = async (newPreferences = "") => {
    setIsLoading(true);
    setErrorBanner(null);

    const allPreviousStyles = rollsHistory.flatMap((r) => r.styles);

    try {
      const res = await fetch("/api/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userCriteria,
          preferences: newPreferences,
          previousStyles: allPreviousStyles,
        }),
      });

      const data = await res.json();
      if (data.styles && data.styles.length > 0) {
        const newRoll = {
          rollIndex: rollsHistory.length,
          styles: data.styles,
          preferences: newPreferences,
        };
        setRollsHistory((prev) => [...prev, newRoll]);
        setCurrentRollIndex(rollsHistory.length);
      }
    } catch (err) {
      console.error("Error rerolling styles:", err);
      setErrorBanner("Could not reroll styles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevRoll = () => {
    if (currentRollIndex > 0) {
      setCurrentRollIndex((prev) => prev - 1);
    }
  };

  const handleNextRoll = () => {
    if (currentRollIndex < rollsHistory.length - 1) {
      setCurrentRollIndex((prev) => prev + 1);
    }
  };

  const handleSelectStyle = (style) => {
    setSelectedStyle(style);
    setCurrentScreen("camera_scanner");
  };

  const handleOutfitComplete = (outfitData) => {
    setCompletedOutfitData(outfitData);
    setCurrentScreen("congrats");
  };

  const handleSaveOutfit = async (outfitPayload) => {
    try {
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outfitPayload),
      });
      const data = await res.json();
      if (data.outfit) {
        setSavedOutfits((prev) => [data.outfit, ...prev]);
        const updated = [data.outfit, ...savedOutfits];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return data.outfit;
      }
    } catch (err) {
      console.error("Failed to save outfit to server:", err);
      const localOutfit = {
        ...outfitPayload,
        id: `local_${Date.now()}`,
      };
      setSavedOutfits((prev) => [localOutfit, ...prev]);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([localOutfit, ...savedOutfits]));
      return localOutfit;
    }
  };

  const handleDeleteOutfit = async (id) => {
    try {
      await fetch(`/api/outfits/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Delete API call failed, removing locally:", err);
    }
    const filtered = savedOutfits.filter((o) => o.id !== id);
    setSavedOutfits(filtered);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  };

  const handleReset = () => {
    setCurrentScreen("questionnaire");
    setSelectedStyle(null);
    setCompletedOutfitData(null);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ATELIER — AI Wardrobe & Outfit Stylist",
          text: "Check out this AI Wardrobe Stylist with Pinterest inspo and closet camera scanning!",
          url,
        });
        return;
      } catch (e) {}
    }
    navigator.clipboard?.writeText(url);
    setShareToast("Link copied to clipboard! Share it with anyone.");
    setTimeout(() => setShareToast(null), 3000);
  };

  const currentStylesList = rollsHistory[currentRollIndex]?.styles || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fc] text-[#0f172a]">
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        savedCount={savedOutfits.length}
        onReset={handleReset}
        onShare={handleShare}
      />

      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
          ✨ {shareToast}
        </div>
      )}

      {errorBanner && (
        <div className="max-w-xl mx-auto mt-4 px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="ml-2 font-bold">
            ✕
          </button>
        </div>
      )}

      <main className="flex-1 pb-16">
        {currentScreen === "questionnaire" && (
          <QuestionnaireScreen
            onSubmit={handleQuestionnaireSubmit}
            isLoading={isLoading}
          />
        )}

        {currentScreen === "styles" && (
          <StyleSelectScreen
            styles={currentStylesList}
            currentRollIndex={currentRollIndex}
            totalRolls={rollsHistory.length}
            onPrevRoll={handlePrevRoll}
            onNextRoll={handleNextRoll}
            onReroll={handleReroll}
            onSelectStyle={handleSelectStyle}
            userCriteria={userCriteria}
            onEditCriteria={() => setCurrentScreen("questionnaire")}
            isLoading={isLoading}
          />
        )}

        {currentScreen === "camera_scanner" && selectedStyle && (
          <CameraScannerScreen
            style={selectedStyle}
            occasion={userCriteria.occasion}
            onOutfitComplete={handleOutfitComplete}
            onBackToStyles={() => setCurrentScreen("styles")}
          />
        )}

        {currentScreen === "congrats" && completedOutfitData && (
          <CongratsScreen
            outfitData={completedOutfitData}
            onSaveOutfit={handleSaveOutfit}
            onGoToFolders={() => setCurrentScreen("wardrobe_folders")}
            onStartNewOutfit={handleReset}
            onShare={handleShare}
          />
        )}

        {currentScreen === "wardrobe_folders" && (
          <WardrobeFoldersScreen
            savedOutfits={savedOutfits}
            onDeleteOutfit={handleDeleteOutfit}
            onStartNewOutfit={handleReset}
          />
        )}
      </main>

      <footer className="border-t border-slate-200/80 bg-white/60 py-4 text-center text-slate-500 text-[11px] font-medium">
        ATELIER NYFW © 2026 — Powered by Google Gemini 3.6 Flash & Pinterest Trend Inspo
      </footer>
    </div>
  );
}
