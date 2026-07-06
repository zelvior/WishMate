import { useEffect, useState, useMemo, useRef } from "react";
import { 
  Sparkles, 
  Music, 
  Gift, 
  Copy, 
  Share2, 
  Cake, 
  Play, 
  Pause, 
  Volume2, 
  RotateCcw,
  User, 
  Calendar, 
  MessageSquare, 
  Smile, 
  Info,
  ExternalLink,
  ChevronRight,
  Heart,
  PartyPopper,
  Download
} from "lucide-react";
import { BUILT_IN_CARDS } from "./data/defaultCards";
import { BirthdayWishConfig, CakeType, CelebrationTheme, MusicTheme, BuiltInCard } from "./types";
import { encodeConfig, decodeConfig } from "./utils/url";
import { playBirthdaySong, stopBirthdaySong, isSongPlaying, playPopSound, playBlowSound } from "./utils/audio";
import ThemeBackground from "./components/ThemeBackground";
import FloatingBalloons from "./components/FloatingBalloons";
import ConfettiExplosion from "./components/ConfettiExplosion";
import BirthdayDashboard from "./components/BirthdayDashboard";
import { generateBirthdayPDF } from "./utils/pdfGenerator";
import ThreeScene from "./components/ThreeScene";
import LegalModals from "./components/LegalModals";

export default function App() {
  // Query state checking for recipient mode
  const [isRecipientMode, setIsRecipientMode] = useState(false);
  const [decodedConfig, setDecodedConfig] = useState<BirthdayWishConfig | null>(null);
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Form Editor Configuration
  const [name, setName] = useState("Alex Johnson");
  const [dob, setDob] = useState("1998-04-12");
  const [message, setMessage] = useState("To the person who makes every single day brighter, funnier, and more colorful! I hope your special day is filled with absolute magic, endless slices of delicious cake, and the grandest of celebrations. Cheers to another year of awesome adventures together!");
  const [creatorName, setCreatorName] = useState("Your Best Friend");
  const [relation, setRelation] = useState("Best Friend");
  const [cakeType, setCakeType] = useState<CakeType>("rainbow");
  const [selectedCardId, setSelectedCardId] = useState("cosmic_dream");
  const [musicTheme, setMusicTheme] = useState<MusicTheme>("pop");
  const [showAgeTicker, setShowAgeTicker] = useState(true);
  
  // Custom personalization states
  const [customTitle, setCustomTitle] = useState("Happy Birthday");
  const [recipientPhoto, setRecipientPhoto] = useState("");
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Image compressor to fit into safe URL lengths (120px bounding box max size)
  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 120;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.65);
          setRecipientPhoto(compressedBase64);
          playPopSound();
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Virtual Interactive Cake State (5 candles)
  const [candles, setCandles] = useState<boolean[]>([true, true, true, true, true]);
  const [showBlowSuccess, setShowBlowSuccess] = useState(false);

  // Web Audio Music State
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // Clipboard & Link Generation State
  const [generatedLink, setGeneratedLink] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Magical Share Link Copied! Send it now 🚀");

  // Live ticking age counter state
  const [ageTicker, setAgeTicker] = useState<{
    years: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  } | null>(null);

  // Parse URL parameters upon mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedWish = params.get("wish");
    
    if (encodedWish) {
      const decoded = decodeConfig(encodedWish);
      if (decoded) {
        setDecodedConfig(decoded);
        setIsRecipientMode(true);
        // Automatically populate states for recipient view
        setName(decoded.name);
        if (decoded.dob) setDob(decoded.dob);
        setMessage(decoded.message);
        setCreatorName(decoded.creatorName);
        setRelation(decoded.relation);
        setCakeType(decoded.cakeType);
        setSelectedCardId(decoded.gifId);
        setMusicTheme(decoded.music);
        setShowAgeTicker(decoded.showAgeTicker);
        if (decoded.customTitle) setCustomTitle(decoded.customTitle);
        if (decoded.recipientPhoto) setRecipientPhoto(decoded.recipientPhoto);
      }
    }
  }, []);

  // Update share link whenever configuration changes
  const activeConfig = useMemo((): BirthdayWishConfig => {
    return {
      name,
      dob,
      message,
      creatorName,
      relation,
      cakeType,
      theme: selectedCardId === "cosmic_dream" ? "cosmic" : 
             selectedCardId === "neon_wave" ? "neon" : 
             selectedCardId === "rose_luxury" ? "rose_gold" : "playful",
      music: musicTheme,
      gifId: selectedCardId,
      showAgeTicker,
      customTitle,
      recipientPhoto
    };
  }, [name, dob, message, creatorName, relation, cakeType, selectedCardId, musicTheme, showAgeTicker, customTitle, recipientPhoto]);

  useEffect(() => {
    const code = encodeConfig(activeConfig);
    const url = `${window.location.origin}${window.location.pathname}?wish=${code}`;
    setGeneratedLink(url);
  }, [activeConfig]);

  // Handle active Card metadata
  const currentCard = useMemo(() => {
    return BUILT_IN_CARDS.find(c => c.id === selectedCardId) || BUILT_IN_CARDS[0];
  }, [selectedCardId]);

  // Compute live age ticking
  useEffect(() => {
    if (!dob) {
      setAgeTicker(null);
      return;
    }

    const interval = setInterval(() => {
      const birthDate = new Date(dob);
      const now = new Date();
      
      if (isNaN(birthDate.getTime()) || birthDate > now) {
        setAgeTicker(null);
        return;
      }

      const diffMs = now.getTime() - birthDate.getTime();
      
      // Calculate age breakdown
      const birthYear = birthDate.getFullYear();
      const birthMonth = birthDate.getMonth();
      const birthDay = birthDate.getDate();

      let years = now.getFullYear() - birthYear;
      let months = now.getMonth() - birthMonth;
      let days = now.getDate() - birthDay;

      if (months < 0 || (months === 0 && days < 0)) {
        years--;
        months += 12;
      }

      // Exact total days elapsed for accurate tick representation
      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();

      setAgeTicker({
        years: years >= 0 ? years : 0,
        days: totalDays,
        hours,
        minutes,
        seconds,
        milliseconds
      });
    }, 50);

    return () => clearInterval(interval);
  }, [dob]);

  // Copy shareable link to clipboard and save birthday to dashboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setToastMessage("Magical Share Link Copied! Send it now 🚀");
    setShowToast(true);
    playPopSound();

    // Save this wish automatically to localStorage
    if (name.trim()) {
      try {
        const data = localStorage.getItem("wishmate_saved_birthdays");
        let currentSaved: any[] = [];
        if (data) {
          currentSaved = JSON.parse(data);
        }
        const existingIdx = currentSaved.findIndex(b => b.name.toLowerCase() === name.toLowerCase());
        if (existingIdx >= 0) {
          currentSaved[existingIdx] = {
            ...currentSaved[existingIdx],
            ...activeConfig,
            createdAt: new Date().toISOString()
          };
        } else {
          currentSaved.unshift({
            id: "bday_" + Math.random().toString(36).substr(2, 9),
            ...activeConfig,
            createdAt: new Date().toISOString()
          });
        }
        localStorage.setItem("wishmate_saved_birthdays", JSON.stringify(currentSaved));
      } catch (e) {
        console.error("Failed to auto-save birthday", e);
      }
    }

    setTimeout(() => setShowToast(false), 3000);
  };

  // Download PDF card representing active design
  const handleDownloadPdfForActive = () => {
    generateBirthdayPDF(activeConfig);
    setToastMessage(`📥 Birthday card for ${activeConfig.name} exported as PDF!`);
    setShowToast(true);
    playPopSound();
    setTimeout(() => setShowToast(false), 3000);
  };

  // Download PNG card representing active design (pixel-perfect)
  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setToastMessage("Generating pixel-perfect PNG... 📸");
      setShowToast(true);
      playPopSound();

      const html2canvas = (await import("html2canvas")).default;
      const element = cardRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3, // High DPI scaling for ultra-sharpness
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_birthday_card.png`;
      link.href = dataUrl;
      link.click();

      setToastMessage("✨ Pixel-Perfect PNG Card Downloaded!");
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error exporting PNG:", error);
      setToastMessage("❌ Failed to generate PNG. Please try again!");
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Download PDF card representing active design (pixel-perfect)
  const handleDownloadPdf = async () => {
    if (!cardRef.current) {
      handleDownloadPdfForActive();
      return;
    }
    try {
      setToastMessage("Generating pixel-perfect PDF... 📄");
      setShowToast(true);
      playPopSound();

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = cardRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3, // High DPI scaling
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15; // mm
      const maxPdfWidth = pageWidth - (margin * 2);
      const maxPdfHeight = pageHeight - (margin * 2);

      const ratio = imgWidth / imgHeight;
      let pdfWidth = maxPdfWidth;
      let pdfHeight = pdfWidth / ratio;

      if (pdfHeight > maxPdfHeight) {
        pdfHeight = maxPdfHeight;
        pdfWidth = pdfHeight * ratio;
      }

      const x = (pageWidth - pdfWidth) / 2;
      const y = (pageHeight - pdfHeight) / 2;

      // Draw backdrop color
      let bgGradientColor = [255, 255, 255];
      if (mappedCelebrationTheme === "cosmic") {
        bgGradientColor = [13, 11, 41];
      } else if (mappedCelebrationTheme === "neon") {
        bgGradientColor = [10, 10, 12];
      } else if (mappedCelebrationTheme === "rose_gold") {
        bgGradientColor = [253, 251, 247];
      } else {
        bgGradientColor = [255, 244, 204];
      }

      doc.setFillColor(bgGradientColor[0], bgGradientColor[1], bgGradientColor[2]);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Draw thin border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10, "D");

      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight, undefined, "FAST");

      // Footer signature
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Created with JoySpark • Interactive Synthesizer Birthday Cards", pageWidth / 2, pageHeight - 12, { align: "center" });

      const safeFilename = `${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_birthday_card.pdf`;
      doc.save(safeFilename);

      setToastMessage("✨ Pixel-Perfect PDF Card Downloaded!");
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      handleDownloadPdfForActive();
    }
  };

  // Toggle synthesized birthday melody
  const handleToggleMusic = () => {
    if (isPlayingMusic) {
      stopBirthdaySong();
      setIsPlayingMusic(false);
    } else {
      playBirthdaySong(musicTheme);
      setIsPlayingMusic(true);
    }
  };

  // Blow out a single virtual candle
  const handleBlowCandle = (index: number) => {
    if (!candles[index]) return; // already blown out
    playBlowSound();
    
    const nextCandles = [...candles];
    nextCandles[index] = false;
    setCandles(nextCandles);

    // If all blown out, trigger reward!
    if (nextCandles.every(c => !c)) {
      setShowBlowSuccess(true);
      setConfettiTrigger(prev => prev + 1);
      playPopSound();
    }
  };

  // Reset interactive cake
  const handleResetCake = () => {
    setCandles([true, true, true, true, true]);
    setShowBlowSuccess(false);
    playPopSound();
  };

  // Visual background style depending on selected built-in card
  const mappedCelebrationTheme: CelebrationTheme = useMemo(() => {
    if (selectedCardId === "cosmic_dream") return "cosmic";
    if (selectedCardId === "neon_wave") return "neon";
    if (selectedCardId === "rose_luxury") return "rose_gold";
    return "playful";
  }, [selectedCardId]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-slate-900 flex flex-col relative overflow-x-hidden select-none">
      
      {/* Background Interactive Particles (Varying on Card Choice) */}
      <ThemeBackground theme={mappedCelebrationTheme} />

      {/* Floating Birthday Balloons background effect */}
      <FloatingBalloons />

      {/* Confetti Explosion trigger element */}
      <ConfettiExplosion triggerCount={confettiTrigger} />

      {/* Recipient Fullscreen Mode */}
      {isRecipientMode ? (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12 z-10 flex flex-col items-center justify-center">
          
          {/* Header Banner - Cleaned of Creator/WishMate References */}
          <div className="w-full flex justify-center items-center bg-white border-4 border-black p-4 mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pink-500 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce"></div>
              <span className="text-lg font-black tracking-wider uppercase italic">A SPECIAL CELEBRATION FOR YOU ✨</span>
            </div>
          </div>

          {/* Core Recipient Gift Layout */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* The Main Majestic Wish Card */}
            <div ref={cardRef} className={`md:col-span-7 rounded-2xl border-4 border-black p-6 md:p-8 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br ${currentCard.gradient} ${currentCard.textColor}`}>
              
              {/* Card Sparkle Details */}
              <div className="absolute top-4 right-4 flex gap-1">
                <span className="text-2xl animate-bounce">🎈</span>
                <span className="text-2xl animate-pulse delay-75">✨</span>
              </div>

              <div className="text-center mb-6 flex flex-col items-center">
                <span className="inline-block px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-pink-300 mb-3 border border-pink-400/20">
                  {currentCard.title}
                </span>

                {/* Elegant, Theme-Matching Framed Recipient Photo */}
                {recipientPhoto && (
                  <div className="mb-4">
                    <div className={`p-1.5 rounded-full border-4 shadow-xl transition-transform hover:scale-105 duration-300 ${
                      mappedCelebrationTheme === 'cosmic' ? 'border-cyan-400 shadow-[0_0_15px_#22d3ee] bg-indigo-950/80' :
                      mappedCelebrationTheme === 'neon' ? 'border-pink-500 shadow-[4px_4px_0px_#000] bg-black' :
                      mappedCelebrationTheme === 'rose_gold' ? 'border-[#fae1b9] shadow-[0_0_12px_rgba(250,225,185,0.6)] bg-[#1c1410]' :
                      'border-yellow-400 shadow-[3px_3px_0px_#000] bg-emerald-100'
                    }`}>
                      <img
                        src={recipientPhoto}
                        alt={name}
                        referrerPolicy="no-referrer"
                        className="w-24 h-24 rounded-full object-cover border-2 border-black"
                      />
                    </div>
                  </div>
                )}

                <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight leading-none mb-2">
                  {customTitle || "Happy Birthday"}
                </h1>
                <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {name}!
                </h2>
              </div>

              {/* Age ticker inside card */}
              {showAgeTicker && ageTicker && (
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">Your Life Journey Timer</p>
                  <div className="grid grid-cols-5 gap-1 font-mono">
                    <div className="bg-black/50 p-2 rounded border border-white/5">
                      <span className="block text-lg font-black text-white">{ageTicker.years}</span>
                      <span className="text-[8px] text-slate-400 uppercase">Years</span>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-white/5 col-span-2">
                      <span className="block text-lg font-black text-pink-400">{ageTicker.days.toLocaleString()}</span>
                      <span className="text-[8px] text-slate-400 uppercase">Total Days</span>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-white/5">
                      <span className="block text-lg font-black text-yellow-400">{ageTicker.hours.toString().padStart(2, '0')}</span>
                      <span className="text-[8px] text-slate-400 uppercase">Hr</span>
                    </div>
                    <div className="bg-black/50 p-2 rounded border border-white/5">
                      <span className="block text-lg font-black text-cyan-400">{ageTicker.seconds.toString().padStart(2, '0')}.<span className="text-xs text-cyan-300/80">{Math.floor(ageTicker.milliseconds / 10).toString().padStart(2, '0')}</span></span>
                      <span className="text-[8px] text-slate-400 uppercase">Sec</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Message Box */}
              <div className="bg-white text-slate-800 border-3 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative mb-6">
                <div className="absolute -top-3 -left-2 bg-pink-500 text-white border-2 border-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  A Special Message
                </div>
                <p className="font-semibold text-sm md:text-base leading-relaxed italic whitespace-pre-line text-slate-700">
                  "{message}"
                </p>
              </div>

              {/* Footer Signature */}
              <div className="flex justify-between items-center text-xs font-bold pt-4 border-t border-white/10 mb-5">
                <span className="opacity-85">Relation: {relation}</span>
                <span className="bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[11px]">
                  With ❤️ from <span className="font-black text-yellow-300">{creatorName}</span>
                </span>
              </div>

              {/* Download Printable Card Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadPng}
                  className="py-3 bg-pink-500 hover:bg-pink-600 text-white border-2 border-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> PNG Export 📸
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="py-3 bg-yellow-300 hover:bg-yellow-400 text-slate-900 border-2 border-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> PDF Export 📄
                </button>
              </div>
            </div>

            {/* Interactive Side Activities: Cake blowing & Synth controller */}
            <div className="md:col-span-5 space-y-6">
              
              {/* Interactive Virtual Cake Blow Out Panel */}
              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl relative">
                <div className="absolute -top-3 left-4 bg-pink-500 text-white border-2 border-black text-xs font-black uppercase px-3 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Make A Wish! 🕯️
                </div>

                <div className="mt-2 text-center">
                  <h3 className="font-black text-lg uppercase tracking-tight">Blow out the Candles</h3>
                  <p className="text-xs text-slate-500 font-medium mb-6">Tap or click each flame to blow them out!</p>
                  
                  {/* The interactive cake drawing */}
                  <div className="relative py-8 flex flex-col items-center justify-center">
                    
                    {/* Render Candles */}
                    <div className="flex gap-4 mb-1 z-10">
                      {candles.map((isLit, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleBlowCandle(idx)}
                          className="flex flex-col items-center cursor-pointer group"
                        >
                          {/* Candle Flame */}
                          {isLit ? (
                            <div className="w-3 h-5 bg-gradient-to-t from-orange-400 via-yellow-300 to-white rounded-full animate-bounce relative shadow-[0_0_10px_#f97316] group-hover:scale-125 transition-transform">
                              <div className="absolute inset-0 bg-yellow-400 rounded-full animate-pulse opacity-75"></div>
                            </div>
                          ) : (
                            <div className="h-5 flex items-center justify-center">
                              <span className="text-[10px] text-slate-400 font-mono animate-fade-out">💨</span>
                            </div>
                          )}
                          {/* Candle Stick */}
                          <div className={`w-2.5 h-10 border-x border-b border-black rounded-b-sm ${
                            idx % 3 === 0 ? 'bg-cyan-300' : idx % 3 === 1 ? 'bg-pink-300' : 'bg-yellow-300'
                          }`}>
                            <div className="w-full h-2 bg-white/40"></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* High Fidelity Interactive 3D Cake Scene */}
                    <div className="w-full h-72 border-4 border-black rounded-2xl overflow-hidden bg-slate-50 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                      <ThreeScene theme={mappedCelebrationTheme} cakeType={cakeType} />
                    </div>
                  </div>

                  {/* Blow success message & Balloon game */}
                  {showBlowSuccess ? (
                    <div className="bg-emerald-50 border-3 border-black p-4 rounded-lg animate-bounce">
                      <p className="font-black text-emerald-800 text-sm uppercase">🎉 MAGICAL WISH GRANTED! 🎉</p>
                      <p className="text-xs text-emerald-600 font-bold mt-1">May all your beautiful dreams and goals align this year!</p>
                      <button 
                        onClick={handleResetCake}
                        className="mt-3 px-3 py-1 bg-white border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all cursor-pointer"
                      >
                        Relight Candles 🕯️
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-bold italic mt-2">Make sure to blow them all out!</p>
                  )}
                </div>
              </div>

              {/* Web Audio Melody Synthesizer Control Panel */}
              <div className="bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl relative">
                <div className="absolute -top-3 left-4 bg-yellow-300 text-slate-900 border-2 border-black text-xs font-black uppercase px-3 py-1 rounded">
                  Synthesizer 🎹
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-sm uppercase">Ambient Birthday Melodies</h4>
                    <p className="text-xs text-slate-500 font-semibold">Style: <span className="text-pink-500 uppercase font-black">{musicTheme} mode</span></p>
                  </div>
                  
                  <button 
                    onClick={handleToggleMusic}
                    className={`p-3 rounded-full border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                      isPlayingMusic ? 'bg-pink-500 text-white' : 'bg-emerald-400 text-slate-900'
                    }`}
                  >
                    {isPlayingMusic ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Legal Footer Links on Recipient Page */}
          <footer className="mt-12 flex justify-center gap-6 text-xs text-slate-500 font-bold z-20">
            <button 
              onClick={() => setLegalModalType("terms")} 
              className="hover:text-pink-500 hover:underline transition-colors cursor-pointer bg-white/60 backdrop-blur-sm px-3 py-1 rounded border border-black/10"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-400">•</span>
            <button 
              onClick={() => setLegalModalType("privacy")} 
              className="hover:text-pink-500 hover:underline transition-colors cursor-pointer bg-white/60 backdrop-blur-sm px-3 py-1 rounded border border-black/10"
            >
              Privacy Policy
            </button>
          </footer>

        </div>
      ) : (
        
        /* Creator / Customizer Studio Mode */
        <div className="flex-1 w-full flex flex-col overflow-hidden max-w-[1200px] mx-auto z-10 p-4 md:p-8">
          
          {/* Main Top Header Navigation */}
          <header className="h-20 flex items-center justify-between px-6 md:px-10 border-4 border-black bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
              <span className="text-2xl font-black tracking-tighter uppercase italic text-pink-500">JOYSPARK.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block font-black text-xs uppercase tracking-widest opacity-50">Studio Workspace v1.4</span>
              <div className="hidden sm:block h-8 w-px bg-black opacity-20"></div>
              <button 
                onClick={handleCopyLink}
                className="px-5 py-2.5 bg-yellow-300 border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
              >
                Share Instant Link ⚡
              </button>
            </div>
          </header>

          {/* Dynamic Configuration Layout split */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-visible">
            
            {/* Left Side: Creative Wish Form Panel */}
            <aside className="lg:col-span-6 bg-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-black leading-none uppercase mb-2">
                  Craft the<br /><span className="text-pink-500">Perfect Wish</span>
                </h1>
                <p className="text-slate-500 font-medium italic text-xs md:text-sm">
                  Customize the experience completely to match their lifestyle and aesthetic.
                </p>
              </div>

              <div className="space-y-6 flex-1">
                
                {/* Input block: Recipient & Birthday Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <User className="w-3 h-3 text-pink-500" /> Recipient Name
                    </label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson" 
                      className="p-3 border-2 border-black bg-blue-50 focus:bg-white outline-none font-bold placeholder:opacity-35 rounded-lg text-sm transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pink-500" /> Birth Date (Optional)
                    </label>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="p-3 border-2 border-black bg-blue-50 focus:bg-white outline-none font-bold placeholder:opacity-35 rounded-lg text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Input block: Sender Name & Relation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Smile className="w-3 h-3 text-pink-500" /> Your Name
                    </label>
                    <input 
                      type="text" 
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder="Your Best Friend" 
                      className="p-3 border-2 border-black bg-blue-50 focus:bg-white outline-none font-bold placeholder:opacity-35 rounded-lg text-sm transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-widest">
                      Your Relation
                    </label>
                    <select 
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      className="p-3 border-2 border-black bg-blue-50 focus:bg-white outline-none font-bold rounded-lg text-sm transition-all"
                    >
                      <option>Best Friend</option>
                      <option>Significant Other</option>
                      <option>Family Member</option>
                      <option>Colleague</option>
                      <option>Mentor</option>
                      <option>Partner in Crime</option>
                    </select>
                  </div>
                </div>

                {/* Input block: Custom Title & Recipient Photo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-widest">
                      Custom Greeting Title
                    </label>
                    <input 
                      type="text" 
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. Happy 21st!" 
                      className="p-3 border-2 border-black bg-blue-50 focus:bg-white outline-none font-bold placeholder:opacity-35 rounded-lg text-sm transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-widest">
                      Recipient Photo (Auto-Framed)
                    </label>
                    <div 
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handlePhotoUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className="border-2 border-dashed border-black hover:border-pink-500 bg-slate-50 hover:bg-pink-50/20 p-2.5 rounded-lg transition-all text-center flex flex-col justify-center items-center cursor-pointer relative group h-[46px]"
                    >
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePhotoUpload(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {recipientPhoto ? (
                        <div className="flex items-center gap-2 w-full justify-between px-2">
                          <img 
                            src={recipientPhoto} 
                            alt="Uploaded avatar" 
                            className="w-7 h-7 rounded-full object-cover border border-black shadow"
                          />
                          <span className="text-[10px] font-black text-emerald-600 truncate max-w-[100px]">Photo Added!</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setRecipientPhoto("");
                              playPopSound();
                            }}
                            className="text-[9px] bg-red-100 text-red-600 hover:bg-red-200 border border-red-300 font-black uppercase px-2 py-0.5 rounded cursor-pointer z-10"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight group-hover:text-pink-600">
                          📁 Drag or Upload Photo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Input block: Custom Message */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-pink-500" /> Birthday Greeting Message
                  </label>
                  <textarea 
                    rows={4} 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter the perfect heartfelt message..." 
                    className="p-3 border-2 border-black bg-blue-50 focus:bg-white outline-none font-bold resize-none placeholder:opacity-35 rounded-lg text-sm transition-all leading-relaxed"
                  />
                </div>

                {/* Selection Block: Cake Style */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-2">
                    1. Select Custom virtual Cake
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'chocolate', emoji: '🎂', label: 'Choco' },
                      { id: 'strawberry', emoji: '🍓', label: 'Berry' },
                      { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
                      { id: 'cyberpunk', emoji: '👾', label: 'Neon' },
                      { id: 'space', emoji: '🪐', label: 'Cosmic' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCakeType(item.id as CakeType);
                          playPopSound();
                        }}
                        className={`p-2 border-2 border-black rounded-xl text-center cursor-pointer transition-all ${
                          cakeType === item.id 
                            ? 'bg-yellow-300 ring-2 ring-black font-black scale-105' 
                            : 'bg-yellow-50/50 hover:bg-yellow-100 font-semibold'
                        }`}
                      >
                        <div className="text-xl mb-1">{item.emoji}</div>
                        <div className="text-[8px] uppercase tracking-wider">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selection Block: Built-in theme card/gradient */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-2">
                    2. Select Card Vibe & Interactive Background
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUILT_IN_CARDS.map((vibe) => (
                      <button
                        key={vibe.id}
                        type="button"
                        onClick={() => {
                          setSelectedCardId(vibe.id);
                          playPopSound();
                        }}
                        className={`p-3 rounded-lg border-2 border-black text-left cursor-pointer transition-all h-20 flex flex-col justify-between relative overflow-hidden ${
                          selectedCardId === vibe.id
                            ? 'bg-gradient-to-br from-slate-100 to-white ring-4 ring-pink-500 scale-[1.02]'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-black uppercase tracking-tight truncate max-w-[80%]">{vibe.name}</span>
                          <span>{vibe.emoji}</span>
                        </div>
                        <div className="text-[8px] text-slate-500 font-bold leading-tight line-clamp-2">
                          {vibe.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selection Block: Synthesizer theme */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-2">
                    3. Select Melody Synthesizer Theme
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'classic', label: 'Classic Jazz', desc: 'Warm' },
                      { id: 'pop', label: 'Retro 8-Bit', desc: 'Chiptune' },
                      { id: 'synthwave', label: 'Synthwave', desc: '80s' },
                      { id: 'lofi', label: 'Chill Lofi', desc: 'Dreamy' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMusicTheme(m.id as MusicTheme);
                          playPopSound();
                        }}
                        className={`p-2 rounded-lg border-2 border-black text-center cursor-pointer transition-all ${
                          musicTheme === m.id
                            ? 'bg-emerald-400 font-black ring-2 ring-black scale-105'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase">{m.label}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional settings: Age Ticker */}
                <div className="flex items-center justify-between bg-slate-50 border-2 border-black p-3 rounded-xl">
                  <div>
                    <span className="text-xs font-black uppercase flex items-center gap-1">
                      Live Age Milestone Clock
                    </span>
                    <p className="text-[10px] text-slate-500 font-bold leading-tight">Ticks the recipient's life elapsed time down to micro-seconds</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showAgeTicker} 
                      onChange={(e) => {
                        setShowAgeTicker(e.target.checked);
                        playPopSound();
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 border border-black"></div>
                  </label>
                </div>

              </div>

              {/* Majestic Link Copier button */}
              <button 
                onClick={handleCopyLink}
                className="mt-8 w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-black text-xl uppercase border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="w-6 h-6" /> Generate Magic Link
              </button>

              {/* Export Controls */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button 
                  onClick={handleDownloadPng}
                  className="py-3 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> PNG Export 📸
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  className="py-3 bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-black text-xs uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> PDF Export 📄
                </button>
              </div>
            </aside>

            {/* Right Side: Live Interactive Phone Preview Mockup */}
            <section className="lg:col-span-6 flex flex-col p-6 md:p-8 bg-[#FFF8F0]/80 border-4 border-dashed border-slate-300 rounded-2xl relative">
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Device Preview</span>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400 border border-black/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400 border border-black/20"></div>
                </div>
              </div>

              {/* Dynamic Mockup viewport */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-[340px] h-[640px] bg-white border-[5px] border-black rounded-[40px] shadow-[15px_15px_0px_0px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative">
                  
                  {/* Phone Header notch */}
                  <div className="h-6 bg-slate-900 flex items-center justify-center relative">
                    <div className="w-20 h-3.5 bg-black rounded-b-xl absolute top-0"></div>
                  </div>

                  {/* Active Preview Content Container */}
                  <div ref={cardRef} className={`flex-1 bg-gradient-to-br ${currentCard.gradient} ${currentCard.textColor} p-5 flex flex-col overflow-y-auto relative scrollbar-none`}>
                    
                    <div className="text-center mt-6 mb-4 flex flex-col items-center">
                      <span className="inline-block px-2.5 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider text-pink-300 mb-2">
                        {currentCard.title}
                      </span>

                      {/* Elegant theme-matched mini frame for recipient photo in mockup */}
                      {recipientPhoto && (
                        <div className="mb-2">
                          <div className={`p-1 rounded-full border-2 shadow-md ${
                            mappedCelebrationTheme === 'cosmic' ? 'border-cyan-400 shadow-[0_0_8px_#22d3ee] bg-indigo-950/80' :
                            mappedCelebrationTheme === 'neon' ? 'border-pink-500 shadow-[2px_2px_0px_#000] bg-black' :
                            mappedCelebrationTheme === 'rose_gold' ? 'border-[#fae1b9] shadow-[0_0_6px_rgba(250,225,185,0.5)] bg-[#1c1410]' :
                            'border-yellow-400 shadow-[2px_2px_0px_#000] bg-emerald-100'
                          }`}>
                            <img
                              src={recipientPhoto}
                              alt={name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-full object-cover border border-black"
                            />
                          </div>
                        </div>
                      )}

                      <h3 className="text-lg font-black uppercase italic leading-none mb-1">
                        {customTitle || "Happy Birthday"}
                      </h3>
                      <h4 className="text-3xl font-black uppercase text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-full">
                        {name || "Alex!"}
                      </h4>
                    </div>

                    {/* Responsive message display */}
                    <div className="bg-white text-slate-800 border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] relative mb-4">
                      <p className="text-[12px] font-semibold text-slate-600 leading-relaxed italic whitespace-pre-line">
                        "{message || "To the person who makes every single day brighter, funnier..."}"
                      </p>
                    </div>

                    {/* Preview Interactive Age display */}
                    {showAgeTicker && ageTicker && (
                      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-center mb-4 font-mono">
                        <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Life Timer Elapsed</span>
                        <div className="grid grid-cols-4 gap-1 text-[11px] text-white">
                          <div className="bg-black/40 p-1 rounded font-black">{ageTicker.years} yrs</div>
                          <div className="bg-black/40 p-1 rounded font-black col-span-2 text-pink-400">{ageTicker.days.toLocaleString()} days</div>
                          <div className="bg-black/40 p-1 rounded font-black text-cyan-300">{ageTicker.seconds}s</div>
                        </div>
                      </div>
                    )}

                    {/* Selected cake drawing preview */}
                    <div className="w-full flex justify-center py-2 mb-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase text-slate-300 mb-2">Your Virtual Cake</span>
                        
                        {/* Static cake representation inside mobile */}
                        <div className="scale-75 origin-center">
                          <div className="flex gap-2 mb-1 justify-center">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex flex-col items-center">
                                <div className="w-2 h-3 bg-gradient-to-t from-orange-400 via-yellow-200 to-white rounded-full animate-pulse shadow-[0_0_5px_#f97316]"></div>
                                <div className="w-1.5 h-6 bg-pink-400 border border-black rounded-b-sm"></div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Mini cake display */}
                          <div className="w-32 h-16 bg-gradient-to-b from-yellow-100 to-yellow-200 border-2 border-black rounded-lg relative overflow-hidden flex flex-col justify-between">
                            <div className="h-4 bg-pink-300 border-b border-black flex justify-around"><span className="text-[10px]">🍒</span></div>
                            <div className="h-3 bg-cyan-300 border-b border-black"></div>
                            <div className="h-4 bg-yellow-400"></div>
                            {/* plate */}
                            <div className="absolute -bottom-1 -left-2 -right-2 h-2 bg-slate-200 border-2 border-black rounded-full"></div>
                          </div>
                        </div>

                      </div>
                    </div>

                    <p className="text-[9px] font-black text-slate-400 mt-auto text-center uppercase tracking-widest">
                      From your {relation} with ❤️
                    </p>

                  </div>

                  {/* Phone bottom bar */}
                  <div className="h-10 border-t-2 border-slate-100 flex items-center justify-center bg-white">
                    <div className="w-20 h-1.5 bg-slate-300 rounded-full"></div>
                  </div>

                </div>
              </div>

              {/* Dynamic share overlay card bottom */}
              <div className="absolute bottom-6 right-6 flex flex-col items-end z-10">
                <div className="p-4 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-[280px] rounded-xl">
                  <p className="text-[10px] font-black uppercase mb-1 flex items-center gap-1.5">
                    <PartyPopper className="w-4 h-4 text-pink-500" /> Shareable Magic Link
                  </p>
                  <p className="text-[8px] text-slate-400 font-bold mb-3">Copy this short link and send it via WhatsApp, Messenger, or email!</p>
                  
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={generatedLink.substring(0, 32) + "..."} 
                      className="flex-1 bg-slate-100 p-2 text-[10px] font-mono font-bold border-2 border-black rounded"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className="px-3 bg-black text-white text-[10px] font-black uppercase rounded cursor-pointer active:scale-95 transition-transform"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

            </section>

          </div>

          {/* Upcoming Birthdays & Saved Wishes Dashboard */}
          <BirthdayDashboard
            currentConfig={activeConfig}
            onLoadConfig={(config) => {
              setName(config.name);
              setDob(config.dob || "");
              setMessage(config.message);
              setCreatorName(config.creatorName);
              setRelation(config.relation);
              setCakeType(config.cakeType);
              setSelectedCardId(config.gifId);
              setMusicTheme(config.music);
              setShowAgeTicker(config.showAgeTicker);
              setCustomTitle(config.customTitle || "Happy Birthday");
              setRecipientPhoto(config.recipientPhoto || "");
              // Scroll to top of designer
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            playPopSound={playPopSound}
            onShowNotification={(msg) => {
              setToastMessage(msg);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            }}
          />

          {/* Legal Footer Links on Creator Page */}
          <footer className="mt-12 mb-6 flex justify-center gap-6 text-xs text-slate-500 font-bold z-20">
            <button 
              onClick={() => setLegalModalType("terms")} 
              className="hover:text-pink-500 hover:underline transition-colors cursor-pointer bg-white/60 backdrop-blur-sm px-3 py-1 rounded border border-black/10"
            >
              Terms & Conditions
            </button>
            <span className="text-slate-400">•</span>
            <button 
              onClick={() => setLegalModalType("privacy")} 
              className="hover:text-pink-500 hover:underline transition-colors cursor-pointer bg-white/60 backdrop-blur-sm px-3 py-1 rounded border border-black/10"
            >
              Privacy Policy
            </button>
          </footer>

        </div>
      )}

      {/* Floating alert toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-yellow-300 text-slate-900 px-6 py-3 border-4 border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_rgba(0,0,0,1)] rounded-xl z-50 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Interactive Legal Modals overlay */}
      <LegalModals 
        isOpen={legalModalType !== null} 
        type={legalModalType} 
        onClose={() => setLegalModalType(null)} 
      />

    </div>
  );
}
