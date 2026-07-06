import { useState, useEffect, useMemo } from "react";
import { BirthdayWishConfig, CakeType, CelebrationTheme, MusicTheme } from "../types";
import { generateBirthdayPDF } from "../utils/pdfGenerator";
import { encodeConfig } from "../utils/url";
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Download, 
  Copy, 
  Edit3, 
  ExternalLink, 
  Search, 
  Cake, 
  Sparkles, 
  Gift, 
  UserPlus
} from "lucide-react";

export interface SavedBirthday extends BirthdayWishConfig {
  id: string;
  createdAt: string;
}

interface BirthdayDashboardProps {
  currentConfig: BirthdayWishConfig;
  onLoadConfig: (config: BirthdayWishConfig) => void;
  playPopSound: () => void;
  onShowNotification: (message: string) => void;
}

export default function BirthdayDashboard({
  currentConfig,
  onLoadConfig,
  playPopSound,
  onShowNotification
}: BirthdayDashboardProps) {
  const [savedBirthdays, setSavedBirthdays] = useState<SavedBirthday[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Load birthdays from localStorage on mount
  useEffect(() => {
    let data = localStorage.getItem("joyspark_saved_birthdays");
    if (!data) {
      data = localStorage.getItem("wishmate_saved_birthdays");
    }
    if (data) {
      try {
        setSavedBirthdays(JSON.parse(data));
      } catch (e) {
        console.error("Failed to parse saved birthdays", e);
      }
    }
  }, []);

  // Sync to localStorage helper
  const saveToStorage = (updatedList: SavedBirthday[]) => {
    localStorage.setItem("joyspark_saved_birthdays", JSON.stringify(updatedList));
    setSavedBirthdays(updatedList);
  };

  // Save the current config in the designer to the dashboard
  const handleSaveCurrentConfig = () => {
    if (!currentConfig.name.trim()) {
      onShowNotification("⚠️ Please provide a recipient name before saving!");
      return;
    }

    // Check if there is already an entry for this recipient name to avoid duplicates or update them
    const existingIndex = savedBirthdays.findIndex(
      (b) => b.name.toLowerCase() === currentConfig.name.toLowerCase()
    );

    let updatedList: SavedBirthday[] = [];
    if (existingIndex >= 0) {
      // Overwrite / Update existing
      const updatedItem: SavedBirthday = {
        ...savedBirthdays[existingIndex],
        ...currentConfig,
        createdAt: new Date().toISOString()
      };
      updatedList = [...savedBirthdays];
      updatedList[existingIndex] = updatedItem;
      onShowNotification(`🎉 Updated birthday wish details for ${currentConfig.name}!`);
    } else {
      // Add brand new entry
      const newItem: SavedBirthday = {
        id: "bday_" + Math.random().toString(36).substr(2, 9),
        ...currentConfig,
        createdAt: new Date().toISOString()
      };
      updatedList = [newItem, ...savedBirthdays];
      onShowNotification(`✨ Saved ${currentConfig.name}'s birthday details to dashboard!`);
    }

    saveToStorage(updatedList);
    playPopSound();
  };

  // Delete entry
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from your birthday list?`)) {
      const updated = savedBirthdays.filter((item) => item.id !== id);
      saveToStorage(updated);
      onShowNotification(`🗑️ Removed ${name} from upcoming birthdays.`);
      playPopSound();
    }
  };

  // Helper: Calculate countdown to next birthday occurrence
  const getCountdownInfo = (dobString: string | undefined) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalized date for exact diffs

    const birthMonth = dob.getMonth();
    const birthDate = dob.getDate();

    // Check if birthday occurred or is coming up this year
    let nextOccurrence = new Date(today.getFullYear(), birthMonth, birthDate);
    if (nextOccurrence < today) {
      // Already passed this year, look at next year
      nextOccurrence.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextOccurrence.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Age they are turning on their next birthday
    const ageNext = nextOccurrence.getFullYear() - dob.getFullYear();

    const formattedTargetDate = nextOccurrence.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    return {
      daysLeft,
      dateString: formattedTargetDate,
      ageNext
    };
  };

  // Generate share link for a saved wish item
  const getShareLink = (item: SavedBirthday) => {
    const cleanItem = {
      name: item.name,
      dob: item.dob,
      message: item.message,
      creatorName: item.creatorName,
      relation: item.relation,
      cakeType: item.cakeType,
      theme: item.theme,
      music: item.music,
      gifId: item.gifId,
      showAgeTicker: item.showAgeTicker,
      customTitle: item.customTitle,
      recipientPhoto: item.recipientPhoto
    };
    const code = encodeConfig(cleanItem);
    return `${window.location.origin}${window.location.pathname}?wish=${code}`;
  };

  const handleCopyLink = (item: SavedBirthday) => {
    const url = getShareLink(item);
    navigator.clipboard.writeText(url);
    onShowNotification(`🚀 Magic link copied for ${item.name}!`);
    playPopSound();
  };

  const handleOpenPreview = (item: SavedBirthday) => {
    const url = getShareLink(item);
    window.open(url, "_blank");
    playPopSound();
  };

  const handleDownloadPDF = (item: SavedBirthday) => {
    generateBirthdayPDF(item);
    onShowNotification(`📥 Downloading high-quality birthday card for ${item.name}!`);
    playPopSound();
  };

  // Filter & sort list of birthdays
  const filteredAndSortedBirthdays = useMemo(() => {
    return savedBirthdays
      .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((b) => {
        const countdown = getCountdownInfo(b.dob);
        return { ...b, countdown };
      })
      .sort((a, b) => {
        // Birthdays with upcoming countdowns go first
        if (a.countdown && b.countdown) {
          return a.countdown.daysLeft - b.countdown.daysLeft;
        }
        if (a.countdown) return -1;
        if (b.countdown) return 1;
        // fallback to creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [savedBirthdays, searchQuery]);

  return (
    <section className="mt-12 bg-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative z-10 w-full">
      
      {/* Decorative Corner Tag */}
      <div className="absolute -top-4 left-6 bg-pink-500 text-white border-2 border-black text-xs font-black uppercase px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <Gift className="w-3.5 h-3.5 animate-bounce" /> Birthday Dashboard
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
            Upcoming Birthdays & Saved Wishes
          </h2>
          <p className="text-xs text-slate-500 font-semibold italic">
            Monitor countdown milestones, download beautiful high-res PDFs, or quickly re-edit and share digital cards.
          </p>
        </div>

        {/* Save Current active wish to list */}
        <button
          onClick={handleSaveCurrentConfig}
          className="bg-yellow-300 hover:bg-yellow-400 border-2 border-black text-slate-900 px-5 py-2.5 font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer self-start md:self-center"
        >
          <UserPlus className="w-4 h-4" /> Save Current to Dashboard
        </button>
      </div>

      {/* List Filters & Search bar */}
      <div className="flex items-center gap-3 bg-slate-50 border-2 border-black rounded-xl p-3 mb-6">
        <Search className="w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved birthday recipients..."
          className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
        />
        {savedBirthdays.length > 0 && (
          <span className="text-[10px] bg-black text-white px-2 py-1 rounded font-black uppercase">
            {filteredAndSortedBirthdays.length} entries
          </span>
        )}
      </div>

      {/* Main Grid View of birthdays */}
      {filteredAndSortedBirthdays.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 rounded-xl py-12 text-center bg-slate-50">
          <Cake className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
          <p className="font-bold text-slate-600 uppercase text-sm">No birthday entries found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 px-4 leading-relaxed">
            {searchQuery 
              ? "No names match your active search filter. Try writing another query!" 
              : "Generate a custom magic link or click 'Save Current to Dashboard' above to track birthdays and count down to their celebrations!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBirthdays.map((item) => (
            <div 
              key={item.id}
              className={`border-4 border-black p-5 rounded-2xl transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
                item.theme === "cosmic" ? "bg-indigo-950 text-white" :
                item.theme === "neon" ? "bg-zinc-950 text-white" :
                item.theme === "rose_gold" ? "bg-[#FAF7F2] text-[#2c1e19]" :
                "bg-amber-50 text-slate-900"
              }`}
            >
              {/* Vibe Corner Tag */}
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-black ${
                  item.theme === "cosmic" ? "bg-cyan-500 text-slate-950" :
                  item.theme === "neon" ? "bg-pink-500 text-white" :
                  item.theme === "rose_gold" ? "bg-amber-200 text-[#2c1e19]" :
                  "bg-emerald-400 text-slate-900"
                }`}>
                  {item.theme}
                </span>
              </div>

              <div>
                {/* Header Information */}
                <div className="flex items-center gap-3 mb-3 mt-1">
                  {item.recipientPhoto ? (
                    <img 
                      src={item.recipientPhoto} 
                      alt={item.name} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-black shadow"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center border-2 border-black font-black text-sm uppercase shadow">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-black text-base uppercase leading-tight truncate pr-14" title={item.name}>
                      {item.name}
                    </h3>
                    <p className={`text-[9px] font-black uppercase ${
                      item.theme === "cosmic" || item.theme === "neon" ? "text-slate-300" : "text-slate-500"
                    }`}>
                      {item.customTitle || "Happy Birthday"}
                    </p>
                  </div>
                </div>

                {/* Countdown display */}
                {item.countdown ? (
                  <div className="bg-black/25 border border-black/10 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div>
                      <span className={`text-[8px] font-black uppercase tracking-wider block opacity-75 ${
                        item.theme === "cosmic" || item.theme === "neon" ? "text-slate-300" : "text-slate-600"
                      }`}>
                        Next Occurrence
                      </span>
                      <span className="text-xs font-bold font-mono">
                        {item.countdown.dateString}
                      </span>
                      <span className="block text-[8px] font-bold opacity-70">
                        (Turning {item.countdown.ageNext})
                      </span>
                    </div>
                    
                    <div className={`text-right px-3 py-1.5 rounded-lg border-2 border-black flex flex-col items-center shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                      item.countdown.daysLeft <= 7 ? "bg-red-400 text-slate-900 animate-pulse" :
                      item.countdown.daysLeft <= 30 ? "bg-yellow-300 text-slate-900" :
                      "bg-emerald-300 text-slate-900"
                    }`}>
                      <span className="text-xs font-black leading-none">{item.countdown.daysLeft}</span>
                      <span className="text-[7px] font-black uppercase tracking-tight">Days left</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/10 rounded-xl p-2 text-center mb-4">
                    <span className="text-[8px] font-black uppercase tracking-wider block opacity-70">
                      No birth date specified
                    </span>
                    <span className="text-[9px] font-bold italic opacity-60">
                      Edit card to add DOB for countdown tracker
                    </span>
                  </div>
                )}

                {/* Custom message preview snippet */}
                <div className={`p-2.5 rounded-lg border border-black/10 text-[10px] font-medium leading-relaxed italic line-clamp-2 mb-4 bg-white/40 ${
                  item.theme === "cosmic" || item.theme === "neon" ? "text-slate-200" : "text-slate-700"
                }`}>
                  "{item.message}"
                </div>
              </div>

              {/* Action buttons row */}
              <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-black/10">
                {/* 1. Edit / Load */}
                <button
                  onClick={() => {
                    onLoadConfig(item);
                    onShowNotification(`🎨 Loaded wish details for ${item.name} into creator studio!`);
                    playPopSound();
                  }}
                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-black rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                  title="Load config back into Designer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* 2. Download PDF */}
                <button
                  onClick={() => handleDownloadPDF(item)}
                  className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-black rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                  title="Download Card as PDF"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* 3. Copy Link */}
                <button
                  onClick={() => handleCopyLink(item)}
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-black rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                  title="Copy Shareable Link"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* 4. Delete */}
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-800 border border-black rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                  title="Delete Birthday from List"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Optional footer metadata */}
              <div className="flex items-center justify-between mt-3 text-[7px] font-bold uppercase tracking-wider opacity-60">
                <span>By: {item.creatorName || "Anonymous"}</span>
                <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

            </div>
          ))}
        </div>
      )}

    </section>
  );
}
