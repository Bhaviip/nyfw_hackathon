import React, { useState } from "react";
import { 
  FolderHeart, 
  Folder, 
  Tag, 
  Trash2, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  Search 
} from "lucide-react";

export default function WardrobeFoldersScreen({
  savedOutfits = [],
  onDeleteOutfit,
  onStartNewOutfit
}) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedOutfitModal, setSelectedOutfitModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const foldersMap = {};
  savedOutfits.forEach((outfit) => {
    const name = outfit.styleName || "Uncategorized Style";
    if (!foldersMap[name]) {
      foldersMap[name] = [];
    }
    foldersMap[name].push(outfit);
  });

  const folderNames = Object.keys(foldersMap);

  const filteredOutfits = (folderName) => {
    const list = foldersMap[folderName] || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (o) =>
        o.occasionTag?.toLowerCase().includes(q) ||
        o.styleName?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.itemName?.toLowerCase().includes(q))
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-600 mb-1">
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Personal Closet Archive</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-4xl font-extrabold text-slate-900">
            My <span className="bright-gradient-text">Style Folders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Saved outfits categorized by aesthetic style and tagged by event
          </p>
        </div>

        <button
          onClick={onStartNewOutfit}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 self-start sm:self-auto shadow-md shadow-pink-500/20 hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>Curate New Outfit</span>
        </button>
      </div>

      {/* Search Bar */}
      {savedOutfits.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event tag, style, or garment..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none shadow-xs transition-all"
          />
        </div>
      )}

      {/* Empty State */}
      {savedOutfits.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-4 border border-slate-200 max-w-lg mx-auto my-8 bg-white shadow-lg shadow-slate-200/50">
          <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto">
            <Folder className="w-8 h-8" />
          </div>
          <h3 className="font-editorial text-xl font-bold text-slate-900">
            Your Wardrobe is Empty
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Use the Style Studio to scan pieces from your closet and save complete Pinterest-inspired looks into style folders.
          </p>
          <button
            onClick={onStartNewOutfit}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wider uppercase transition-all inline-flex items-center gap-2 mt-2 shadow-md shadow-pink-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create First Outfit</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders Navigation Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                selectedFolder === null
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              All Folders ({savedOutfits.length})
            </button>
            {folderNames.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedFolder(name)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFolder === name
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20"
                    : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold ml-1">
                  {foldersMap[name].length}
                </span>
              </button>
            ))}
          </div>

          {/* Outfits List per Folder */}
          {(selectedFolder ? [selectedFolder] : folderNames).map((folderName) => {
            const list = filteredOutfits(folderName);
            if (list.length === 0) return null;

            return (
              <div key={folderName} className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-editorial text-lg font-bold">
                  <Folder className="w-5 h-5 text-pink-500" />
                  <span>Folder: {folderName}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({list.length} {list.length === 1 ? "look" : "looks"})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {list.map((outfit) => (
                    <div
                      key={outfit.id}
                      className="glass-card rounded-3xl p-5 border border-slate-200 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/10 transition-all space-y-4 bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-xs font-bold">
                            <Tag className="w-3 h-3" />
                            #{outfit.occasionTag.replace(/\s+/g, "_")}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(outfit.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={() => onDeleteOutfit(outfit.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete outfit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {outfit.items?.map((item, iIdx) => (
                          <div
                            key={iIdx}
                            className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 relative group"
                          >
                            <img
                              src={item.image}
                              alt={item.itemName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-xs p-1 text-[9px] font-bold text-center text-slate-800 truncate">
                              {item.category}
                            </div>
                          </div>
                        ))}
                      </div>

                      {outfit.editorialReview && (
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-0.5">
                          <div className="text-[10px] font-bold uppercase text-purple-700">
                            {outfit.editorialReview.editorialTitle}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {outfit.editorialReview.editorialReview}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedOutfitModal(outfit)}
                        className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>View Look Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outfit Detail Modal */}
      {selectedOutfitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-pink-100 text-pink-700">
                  Folder: {selectedOutfitModal.styleName}
                </span>
                <h3 className="font-editorial text-2xl font-bold text-slate-900 mt-1.5">
                  Tag: #{selectedOutfitModal.occasionTag}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOutfitModal(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Scanned Items ({selectedOutfitModal.items?.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedOutfitModal.items?.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200 flex gap-2.5 items-center">
                    <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.itemName} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="text-[10px] font-bold text-pink-600 uppercase">{item.category}</div>
                      <div className="text-xs font-bold text-slate-900 truncate">{item.itemName}</div>
                      <div className="text-[10px] text-slate-500">{item.color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOutfitModal.editorialReview && (
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 space-y-1.5">
                <h4 className="font-editorial text-sm font-bold text-purple-900">
                  {selectedOutfitModal.editorialReview.editorialTitle}
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {selectedOutfitModal.editorialReview.editorialReview}
                </p>
                {selectedOutfitModal.editorialReview.masterTip && (
                  <div className="text-xs text-purple-900 pt-1.5 border-t border-purple-200">
                    Styling Tip: {selectedOutfitModal.editorialReview.masterTip}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedOutfitModal(null)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs tracking-wider uppercase"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
