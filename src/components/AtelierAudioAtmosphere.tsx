import React, { useState, useEffect, useRef } from 'react';
import { Music, VolumeX, Volume2, Play, Pause, ChevronRight, ChevronLeft, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Track {
  nameAr: string;
  nameEn: string;
  url: string;
  duration: string;
}

const ATELIER_PLAYLIST: Track[] = [
  {
    nameAr: "أوتار الحرير الملكي 🎻",
    nameEn: "Royal Silk Strings",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "6:12"
  },
  {
    nameAr: "رواق الصالون الهادئ 🎹",
    nameEn: "Couture Salon Piano",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: "5:04"
  },
  {
    nameAr: "أقمار الروز والساتان 🌙",
    nameEn: "Blush Rose & Moon",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: "4:42"
  }
];

export default function AtelierAudioAtmosphere() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [songProgress, setSongProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<any>(null);

  const activeTrack = ATELIER_PLAYLIST[currentIndex];

  useEffect(() => {
    // Lazy initialize the HTML audio element to prevent page load blocking and respect browser autoplay directives
    audioRef.current = new Audio(activeTrack.url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Handle source track changes
  useEffect(() => {
    if (!audioRef.current) return;

    const wasPlaying = isPlaying;
    audioRef.current.pause();
    audioRef.current.src = activeTrack.url;
    audioRef.current.load();
    setSongProgress(0);

    if (wasPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn("Audio autoplay blocked by browser policy:", err);
          setIsPlaying(false);
        });
    }
  }, [currentIndex]);

  // Handle Play / Pause state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play()
        .catch(err => {
          console.warn("Audio play blocked:", err);
          setIsPlaying(false);
        });

      // Start progress simulation
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const curr = audioRef.current.currentTime;
          const dur = audioRef.current.duration || 280;
          setSongProgress((curr / dur) * 100);
        }
      }, 1000);
    } else {
      audioRef.current.pause();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ATELIER_PLAYLIST.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ATELIER_PLAYLIST.length) % ATELIER_PLAYLIST.length);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-24 left-6 z-40 font-sans" dir="rtl">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-[#FAFAF7]/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-150 w-64 ring-4 ring-[#FAF4F5]/30 select-none overflow-hidden"
          >
            {/* Elegant Background ambient gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF4F5] via-transparent to-amber-50/10 pointer-events-none" />
            
            <div className="relative z-10 space-y-3">
              {/* Header Title */}
              <div className="flex justify-between items-center flex-row-reverse border-b border-gray-100 pb-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] text-gray-400 hover:text-black font-semibold cursor-pointer"
                >
                  إخفاء ✕
                </button>
                <div className="flex items-center gap-1">
                  <Sparkles size={11} className="text-[#DF8A9C] animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#0B0B0B] font-serif">SULTA Atelier Radio</span>
                </div>
              </div>

              {/* Album Art / Glow Disc Representation */}
              <div className="flex items-center gap-3 bg-[#0B0B0B]/5 p-2 rounded-xl border border-white/50">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-tr from-amber-100 via-pink-100 to-[#0B0B0B] flex items-center justify-center shadow-inner relative overflow-hidden shrink-0 ${isPlaying ? "animate-spin-[12s] linear" : ""}`}>
                  {/* CD Vinyl effect circles */}
                  <div className="absolute inset-2 border border-white/40 rounded-full" />
                  <div className="absolute inset-3.5 border-2 border-[#0B0B0B]/20 rounded-full bg-white" />
                  <Music size={14} className="text-[#0B0B0B] relative z-10" />
                </div>
                
                <div className="min-w-0 flex-1 text-right">
                  <h5 className="text-[11px] font-bold text-gray-900 truncate leading-tight">{activeTrack.nameAr}</h5>
                  <span className="text-[9px] text-gray-400 font-serif italic block tracking-wide truncate mt-0.5">{activeTrack.nameEn}</span>
                </div>
              </div>

              {/* Progress Bar slider */}
              <div className="space-y-1">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#DF8A9C] to-amber-300 rounded-full transition-all duration-1000"
                    style={{ width: `${songProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-gray-400">
                  <span>{activeTrack.duration}</span>
                  <span>أجواء كوتور مخصصة ✨</span>
                </div>
              </div>

              {/* Music Players Navigation Buttons */}
              <div className="flex items-center justify-center gap-4 py-1.5 flex-row-reverse">
                <button
                  onClick={handleNext}
                  className="p-1 text-gray-500 hover:text-black transition-all cursor-pointer"
                  title="المقطع التالي"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#DF8A9C] hover:text-white flex items-center justify-center shadow-md transition-all cursor-pointer scale-105 active:scale-95"
                  title={isPlaying ? "إيقاف مؤقت" : "تشغيل الأجواء الملكية"}
                >
                  {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="mr-0.5" />}
                </button>

                <button
                  onClick={handlePrev}
                  className="p-1 text-gray-500 hover:text-black transition-all cursor-pointer"
                  title="المقطع السابق"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Volume Controller sliders & mute toggle */}
              <div className="flex items-center gap-2 justify-end pt-1 flex-row-reverse">
                <button
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-[#0B0B0B] transition-colors cursor-pointer"
                  title={isMuted ? "إلغاء كتم" : "كتم الصوت"}
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-20 accent-[#0B0B0B] h-0.5 bg-gray-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            layoutId="atelier-radio-btn"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#DF8A9C] hover:text-white px-3.5 py-3.5 rounded-full shadow-lg transition-all z-40 select-none cursor-pointer group active:scale-90 border border-[#F6E7A6]/20"
            title="افتح راديو وأجواء صالون Sulta الهادئ 📻"
          >
            <div className={`relative flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}>
              <Wand2 size={15} className="group-hover:rotate-12 transition-transform duration-300" />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#DF8A9C] rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] font-sans font-bold select-none max-w-0 overflow-hidden group-hover:max-w-[4.2rem] transition-all duration-500 whitespace-nowrap">راديو الصالون 📻</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
