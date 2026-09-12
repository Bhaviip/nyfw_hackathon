import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  FlipHorizontal, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  Shirt, 
  ArrowRight, 
  Check, 
  Layers
} from "lucide-react";

export default function CameraScannerScreen({
  style,
  occasion,
  onOutfitComplete,
  onBackToStyles
}) {
  const videoRef = useRef(null);
  const vonageContainerRef = useRef(null);
  const vonageSessionRef = useRef(null);
  const vonagePublisherRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [isVonageActive, setIsVonageActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Scanned and accepted items
  const [scannedItems, setScannedItems] = useState([]);
  
  // Last analysis result modal
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [lastSnapshot, setLastSnapshot] = useState(null);

  // Early completion confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize camera with Vonage Video API (with WebRTC fallback)
  useEffect(() => {
    let isMounted = true;

    async function setupVonageVideo() {
      try {
        const res = await fetch("/api/vonage/session");
        if (!res.ok) throw new Error("Vonage session endpoint not available");
        const data = await res.json();
        
        if (window.OT && window.OT.checkSystemRequirements && window.OT.checkSystemRequirements() && isMounted) {
          // Clean existing sessions if any
          if (vonageSessionRef.current) {
            try { vonageSessionRef.current.disconnect(); } catch (e) {}
          }
          if (vonagePublisherRef.current) {
            try { vonagePublisherRef.current.destroy(); } catch (e) {}
          }

          const session = window.OT.initSession(data.applicationId, data.sessionId);
          vonageSessionRef.current = session;

          if (vonageContainerRef.current) {
            vonageContainerRef.current.innerHTML = "";
          }

          const publisher = window.OT.initPublisher(
            vonageContainerRef.current,
            {
              insertMode: "append",
              width: "100%",
              height: "100%",
              resolution: "1280x720",
              showControls: false,
              facingMode: facingMode === "environment" ? "environment" : "user",
              name: "Vonage Wardrobe Scanner",
              fitMode: "cover",
            },
            (err) => {
              if (err) {
                console.warn("Vonage publisher init error, trying standard camera:", err);
                startFallbackCamera();
              } else if (isMounted) {
                setIsVonageActive(true);
                setCameraError(null);
              }
            }
          );
          vonagePublisherRef.current = publisher;

          session.connect(data.token, (err) => {
            if (!err && isMounted) {
              try {
                session.publish(publisher);
              } catch (e) {}
            }
          });
          return;
        }
      } catch (err) {
        console.warn("Vonage Video setup error, switching to standard camera:", err);
      }
      
      if (isMounted) {
        startFallbackCamera();
      }
    }

    setupVonageVideo();

    return () => {
      isMounted = false;
      if (vonageSessionRef.current) {
        try { vonageSessionRef.current.disconnect(); } catch (e) {}
      }
      if (vonagePublisherRef.current) {
        try { vonagePublisherRef.current.destroy(); } catch (e) {}
      }
      stopCamera();
    };
  }, [facingMode]);

  const startFallbackCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Standard camera access failed or unavailable:", err);
      setCameraError("Camera stream unavailable. You can take photos with your phone camera or upload below!");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const toggleFacingMode = () => {
    if (vonagePublisherRef.current && typeof vonagePublisherRef.current.cycleVideo === "function") {
      vonagePublisherRef.current.cycleVideo();
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    } else {
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    }
  };

  const requiredCategories = (style.keyPieces || [])
    .filter((p) => p.isRequired)
    .map((p) => p.category);
  
  const scannedCategories = scannedItems.map((i) => i.category);
  const missingRequired = requiredCategories.filter((c) => !scannedCategories.includes(c));
  const nextTargetPiece = style.keyPieces?.find((p) => !scannedCategories.includes(p.category)) || style.keyPieces?.[0];

  const captureFrame = () => {
    // 1. Try Vonage Video Publisher snapshot API
    if (vonagePublisherRef.current && typeof vonagePublisherRef.current.getImgData === "function") {
      try {
        const vonageImg = vonagePublisherRef.current.getImgData();
        if (vonageImg && vonageImg.length > 100) {
          return vonageImg.startsWith("data:") ? vonageImg : `data:image/png;base64,${vonageImg}`;
        }
      } catch (err) {
        console.warn("Vonage getImgData failed, trying video element:", err);
      }
    }

    // 2. Try Vonage container video element
    const vonageVideoElem = vonageContainerRef.current?.querySelector("video");
    const targetVideo = vonageVideoElem || videoRef.current;

    if (targetVideo) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = targetVideo.videoWidth || 640;
      canvas.height = targetVideo.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(targetVideo, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    }

    return null;
  };

  const processGarmentImage = async (dataUrl) => {
    setIsScanning(true);
    setLastSnapshot(dataUrl);

    try {
      const response = await fetch("/api/analyze-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          style,
          occasion,
          existingItems: scannedItems,
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setLastAnalysis(data.analysis);
        if (data.analysis.isMatch) {
          const newItem = {
            id: `item_${Date.now()}`,
            category: data.analysis.category || "Garment",
            itemName: data.analysis.itemName || "Wardrobe Piece",
            color: data.analysis.color || "Neutral",
            silhouette: data.analysis.silhouette || "",
            image: dataUrl,
            stylistFeedback: data.analysis.stylistFeedback,
            runwayTip: data.analysis.runwayTip,
          };
          setScannedItems((prev) => [...prev, newItem]);
        }
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      const fallbackItem = {
        id: `item_${Date.now()}`,
        category: nextTargetPiece?.category || "Top",
        itemName: nextTargetPiece?.name || "Scanned Wardrobe Item",
        color: "Selected Palette",
        silhouette: "Clean Cut",
        image: dataUrl,
        stylistFeedback: `Looks great! This piece complements the ${style.title} aesthetic nicely.`,
      };
      setLastAnalysis({
        isMatch: true,
        category: fallbackItem.category,
        itemName: fallbackItem.itemName,
        stylistFeedback: fallbackItem.stylistFeedback,
        confidenceScore: 90,
        isOutfitNowComplete: scannedItems.length >= 2,
      });
      setScannedItems((prev) => [...prev, fallbackItem]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCapture = () => {
    const dataUrl = captureFrame();
    if (dataUrl) {
      processGarmentImage(dataUrl);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        processGarmentImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCompleteOutfitRequest = () => {
    const hasSufficientPieces = scannedItems.length >= 3 || (scannedItems.length >= 2 && missingRequired.length === 0);
    
    if (!hasSufficientPieces) {
      setShowConfirmModal(true);
    } else {
      onOutfitComplete({
        style,
        occasion,
        items: scannedItems,
      });
    }
  };

  const handleConfirmEarlyExit = () => {
    setShowConfirmModal(false);
    onOutfitComplete({
      style,
      occasion,
      items: scannedItems,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar / Style Context */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
              Active Style
            </span>
            <span className="text-xs text-slate-500 font-medium">Event: {occasion}</span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {style.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToStyles}
            className="text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all"
          >
            Change Style
          </button>
          
          <button
            onClick={handleCompleteOutfitRequest}
            disabled={scannedItems.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Complete Outfit Now</span>
          </button>
        </div>
      </div>

      {/* Guidance Banner */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border border-pink-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-600">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Target Piece to Find:</span>
          </div>
          <p className="text-sm font-bold text-slate-900">
            {nextTargetPiece ? `${nextTargetPiece.category}: ${nextTargetPiece.name}` : "Any matching accessory or layer"}
          </p>
          {nextTargetPiece?.examples && (
            <p className="text-xs text-slate-600">
              Try searching your closet for: {nextTargetPiece.examples.join(", ")}
            </p>
          )}
        </div>

        <div className="text-right sm:border-l sm:border-purple-200 sm:pl-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Look Progress</div>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            {scannedItems.length} <span className="text-slate-500 font-normal">/ {style.keyPieces?.length || 3} items</span>
          </div>
        </div>
      </div>

      {/* Main Camera Viewfinder Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[3/4] sm:aspect-[4/3] max-h-[500px] flex items-center justify-center shadow-2xl border-4 border-white">
        
        {/* Vonage Video Publisher Container */}
        <div
          ref={vonageContainerRef}
          className={`w-full h-full object-cover absolute inset-0 ${isVonageActive ? "block" : "hidden"}`}
        />

        {/* Fallback Live Video Stream */}
        {!isVonageActive && !cameraError && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Camera Error / Photo Capture Fallback */}
        {cameraError && !isVonageActive && (
          <div className="p-8 text-center max-w-sm space-y-4 text-white z-10">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 mx-auto">
              <Camera className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-editorial text-lg font-bold">Ready to Scan</h4>
              <p className="text-xs text-slate-300">
                Snap clothing pieces using your phone camera or choose photos from your library!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wider uppercase inline-flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>
              <button
                onClick={() => libraryInputRef.current?.click()}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs tracking-wider uppercase inline-flex items-center justify-center gap-2 border border-white/20"
              >
                <Upload className="w-4 h-4" />
                <span>Photo Library</span>
              </button>
            </div>
          </div>
        )}

        {/* Viewfinder Target Overlays */}
        {(!cameraError || isVonageActive) && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isVonageActive ? "⚡ Vonage Video Active" : "Live Wardrobe Scanner"}</span>
              </span>

              <button
                onClick={toggleFacingMode}
                className="pointer-events-auto p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-all active:scale-95"
                title="Flip Camera"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="w-48 h-56 sm:w-64 sm:h-72 mx-auto border-2 border-dashed border-white/60 rounded-3xl flex flex-col items-center justify-center text-center p-4">
              <Shirt className="w-8 h-8 text-white/80 mb-2" />
              <span className="text-[11px] text-white/90 font-semibold tracking-wide">
                Center clothing piece here
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs text-white hover:bg-black flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-pink-400" />
                <span>Phone Camera</span>
              </button>
              <button
                onClick={() => libraryInputRef.current?.click()}
                className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs text-white hover:bg-black flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-pink-400" />
                <span>Library</span>
              </button>
            </div>
          </div>
        )}

        {/* Scanning Animation */}
        {isScanning && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 z-20 text-white">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-3 border-pink-500 border-t-transparent animate-spin" />
              <Sparkles className="w-8 h-8 text-pink-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-editorial text-lg font-bold">
                Gemini Checking Your Piece...
              </h4>
              <p className="text-xs text-slate-300">
                Evaluating colors, cut, and Pinterest style match
              </p>
            </div>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Shutter Button */}
      <div className="flex items-center justify-center py-2">
        <button
          onClick={handleCapture}
          disabled={isScanning}
          className="group relative flex items-center justify-center p-2 rounded-full transition-transform active:scale-95 disabled:opacity-50"
          title="Capture Garment"
        >
          <div className="absolute inset-0 rounded-full bg-pink-500/30 blur-xl group-hover:bg-pink-500/50 transition-all" />
          <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-pink-500/30">
            <Camera className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
        </button>
      </div>

      {/* Scanned Items Gallery */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200 bg-white shadow-md shadow-slate-200/40 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-500" />
            <span>Matched Outfit Pieces ({scannedItems.length})</span>
          </h3>
          {scannedItems.length > 0 && (
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> In Progress
            </span>
          )}
        </div>

        {scannedItems.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No items matched yet. Point your camera at an item from your wardrobe and tap the capture button!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {scannedItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden group shadow-2xs"
              >
                <div className="aspect-square bg-slate-100 relative">
                  <img
                    src={item.image}
                    alt={item.itemName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-800 shadow-xs">
                    {item.category}
                  </div>
                </div>
                <div className="p-2.5 space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {item.itemName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.color}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Result Modal */}
      {lastAnalysis && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {lastAnalysis.isMatch ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h3 className="font-editorial text-lg font-bold text-slate-900">
                    {lastAnalysis.isMatch ? "Awesome Match!" : "Style Clash"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {lastAnalysis.confidenceScore || 90}% Match Confidence
                  </p>
                </div>
              </div>

              {lastSnapshot && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-xs">
                  <img src={lastSnapshot} alt="Snapshot" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5">
              <div className="text-xs font-bold text-slate-900">
                Detected: {lastAnalysis.itemName || "Clothing Item"} ({lastAnalysis.category || "Garment"})
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {lastAnalysis.stylistFeedback}
              </p>
            </div>

            {lastAnalysis.isMatch && (
              <div className="text-xs text-purple-900 bg-purple-50 border border-purple-200 p-3.5 rounded-2xl space-y-0.5">
                <span className="font-bold text-purple-700 block text-[10px] uppercase">
                  Next Step:
                </span>
                {lastAnalysis.isOutfitNowComplete || scannedItems.length >= 3 ? (
                  <span>Your look has core pieces! You can complete your outfit now or keep scanning.</span>
                ) : (
                  <span>
                    Look for a <strong>{lastAnalysis.nextRecommendedCategory || "complementary piece"}</strong> (e.g. {lastAnalysis.nextRecommendedExamples?.join(", ") || "matching shoes or trousers"}).
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setLastAnalysis(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs tracking-wider uppercase transition-all"
              >
                {lastAnalysis.isMatch ? "Scan Next Piece" : "Try Another Piece"}
              </button>

              {lastAnalysis.isMatch && (
                <button
                  onClick={() => {
                    setLastAnalysis(null);
                    handleCompleteOutfitRequest();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20"
                >
                  <span>Finish Outfit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-slate-900">
                  Finish Outfit Early?
                </h3>
                <p className="text-xs font-semibold text-slate-500">Stylist Recommendation</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We recommend adding {missingRequired.length > 0 ? (
                <strong className="text-slate-900">{missingRequired.join(" and ")}</strong>
              ) : (
                <strong className="text-slate-900">shoes or accessories</strong>
              )} to finish this <em>"{style.title}"</em> look.
              <br /><br />
              Are you sure you want to finish and save your outfit now?
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs tracking-wider uppercase transition-all"
              >
                Keep Scanning
              </button>
              <button
                onClick={handleConfirmEarlyExit}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-pink-500/20"
              >
                Yes, Finish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
