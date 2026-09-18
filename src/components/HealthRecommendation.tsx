import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';

interface HealthRecommendationProps {
  currentData: { pm25: number; pm10: number; temperature: number } | null;
}

export function HealthRecommendation({ currentData }: HealthRecommendationProps) {
  const pm25 = currentData?.pm25 ?? null;

  const status = useMemo(() => {
    if (pm25 === null) {
      return {
        icon: '⏳',
        title: 'Menunggu Data Sensor...',
        insight: 'Sistem sedang mencoba terhubung dengan perangkat untuk mengambil data terbaru.',
        badge: '⚫ MENUNGGU',
        glow: 'shadow-[0_0_30px_-10px_rgba(148,163,184,0.1)]',
        accentText: 'text-slate-500',
        badgeBg: 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
        categoryIndex: -1
      };
    } else if (pm25 <= 50) {
      return {
        icon: '😊',
        title: 'Udara Sangat Bersih & Aman',
        insight: 'Kualitas udara sangat baik. Sangat aman dan sehat untuk segala aktivitas luar ruangan.',
        badge: '🟢 BAIK',
        glow: 'shadow-[0_0_30px_-10px_rgba(34,197,94,0.25)]',
        accentText: 'text-green-500',
        badgeBg: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
        categoryIndex: 0
      };
    } else if (pm25 <= 100) {
      return {
        icon: '😷',
        title: 'Gunakan Masker Bagi yang Sensitif',
        insight: 'Kualitas udara sedang. Kelompok rentan & penderita pernapasan disarankan mengenakan masker saat di luar.',
        badge: '🔵 SEDANG',
        glow: 'shadow-[0_0_30px_-10px_rgba(59,130,246,0.25)]',
        accentText: 'text-blue-500',
        badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
        categoryIndex: 1
      };
    } else if (pm25 <= 200) {
      return {
        icon: '⚠️',
        title: 'Udara Tidak Sehat',
        insight: 'Kualitas udara tidak sehat. Wajib mengenakan masker medis/KN95 dan batasi aktivitas fisik di luar.',
        badge: '🟡 TIDAK SEHAT',
        glow: 'shadow-[0_0_30px_-10px_rgba(234,179,8,0.25)]',
        accentText: 'text-yellow-500',
        badgeBg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
        categoryIndex: 2
      };
    } else if (pm25 <= 300) {
      return {
        icon: '🚨',
        title: 'Sangat Tidak Sehat',
        insight: 'Udara sangat tidak sehat. Tutup jendela, gunakan air purifier, dan hindari aktivitas di luar ruangan.',
        badge: '🔴 SANGAT TIDAK SEHAT',
        glow: 'shadow-[0_0_30px_-10px_rgba(239,68,68,0.25)]',
        accentText: 'text-red-500',
        badgeBg: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
        categoryIndex: 3
      };
    } else {
      return {
        icon: '☣️',
        title: 'Kondisi Darurat Berbahaya',
        insight: 'Kualitas udara berada pada tingkat berbahaya bagi semua orang. Tetap di dalam ruangan dengan ventilasi tertutup.',
        badge: '⚫ BERBAHAYA',
        glow: 'shadow-[0_0_30px_-10px_rgba(30,41,59,0.3)]',
        accentText: 'text-slate-700 dark:text-slate-400',
        badgeBg: 'bg-slate-500/15 border-slate-500/30 text-slate-700 dark:text-slate-400',
        categoryIndex: 4
      };
    }
  }, [pm25]);

  const legendItems = [
    { label: 'Baik', range: '1–50', color: 'bg-green-500', text: 'text-green-700 dark:text-green-400', bg: 'bg-green-500/10 border-green-500/20', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]' },
    { label: 'Sedang', range: '51–100', color: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]' },
    { label: 'Tidak Sehat', range: '101–200', color: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]' },
    { label: 'Sgt Tdk Sehat', range: '201–300', color: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/20', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]' },
    { label: 'Berbahaya', range: '≥301', color: 'bg-slate-800 dark:bg-slate-400', text: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20', glow: 'shadow-[0_0_12px_rgba(100,116,139,0.4)]' },
  ];

  return (
    <motion.div 
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-3.5 sm:p-4 border border-blue-100/60 dark:border-slate-700/60 h-full flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${status.glow} shadow-[0_4px_24px_rgba(0,0,0,0.03)]`}
    >
      <div className="flex items-center justify-between z-10 shrink-0 gap-2 mb-1.5">
        <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-800 dark:text-white leading-tight flex items-center gap-1.5 truncate">
          <span>🩺</span> Rekomendasi Kesehatan
        </h3>
        <div className={`px-3 py-1 rounded-full border text-[9px] sm:text-[11px] font-bold tracking-wide transition-colors duration-300 shrink-0 ${status.badgeBg}`}>
          {status.badge}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status.title}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex items-center gap-3 sm:gap-4 my-1.5 sm:my-auto py-1.5 z-10 min-h-0"
        >
          <div className="text-[32px] sm:text-[44px] lg:text-[50px] leading-none drop-shadow-sm select-none shrink-0 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
            {status.icon}
          </div>
          
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-sm sm:text-lg lg:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-1 truncate">
              {status.title}
            </h2>
            <p className="text-[11.5px] sm:text-sm text-slate-600 dark:text-slate-300 leading-snug font-medium transition-colors duration-300 line-clamp-2">
              {status.insight}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="pt-2.5 mt-1.5 border-t border-slate-100 dark:border-slate-700/60 w-full z-10 shrink-0">
        <div className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 text-center">Standar Kualitas Udara (PM2.5)</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 lg:gap-2">
          {legendItems.map((item, idx) => {
            const isActive = status.categoryIndex === idx;
            return (
              <motion.div 
                key={idx}
                animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border ${isActive ? `${item.bg} ${item.glow} z-10 relative font-bold` : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'} transition-all duration-200`}
              >
                <div className="flex items-center gap-1.5 mb-1 w-full justify-center overflow-hidden">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${item.color} ${isActive ? 'animate-pulse' : ''}`}></div>
                  <span className={`text-[8px] sm:text-[9.5px] font-bold uppercase tracking-tight truncate text-center ${isActive ? item.text : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
                <span className={`text-[8.5px] sm:text-[10px] font-semibold tabular-nums leading-none ${isActive ? item.text : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.range}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
