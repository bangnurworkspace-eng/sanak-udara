import { motion } from 'motion/react';
import { useSmoothValue } from '../hooks/useSmoothValue';

interface GaugeMeterProps {
  value: number | null;
}

export function GaugeMeter({ value }: GaugeMeterProps) {
  const smoothValue = useSmoothValue(value ?? 0, 700);

  const getCategory = (val: number | null) => {
    if (val === null) return { label: 'MENUNGGU DATA', color: '#94a3b8', bg: 'bg-slate-100 dark:bg-slate-800/80', text: 'text-slate-500 dark:text-slate-400', glow: 'rgba(148, 163, 184, 0.1)' };
    if (val <= 50) return { label: 'BAIK', color: '#16a34a', bg: 'bg-green-50/90 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', glow: 'rgba(22, 163, 74, 0.25)' }; // Hijau
    if (val <= 100) return { label: 'SEDANG', color: '#3b82f6', bg: 'bg-blue-50/90 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', glow: 'rgba(59, 130, 246, 0.25)' }; // Biru
    if (val <= 200) return { label: 'TIDAK SEHAT', color: '#eab308', bg: 'bg-yellow-50/90 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', glow: 'rgba(234, 179, 8, 0.25)' }; // Kuning
    if (val <= 300) return { label: 'SANGAT TIDAK SEHAT', color: '#ef4444', bg: 'bg-red-50/90 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', glow: 'rgba(239, 68, 68, 0.25)' }; // Merah
    return { label: 'BERBAHAYA', color: '#1e293b', bg: 'bg-slate-200 dark:bg-slate-800/80', text: 'text-slate-800 dark:text-slate-300', glow: 'rgba(30, 41, 59, 0.3)' }; // Hitam
  };

  const category = getCategory(value === null ? null : smoothValue);
  
  // Radius and stroke calculations
  const cx = 210;
  const cy = 205;
  const radius = 165;
  const strokeWidth = 26;
  const circumference = radius * Math.PI;
  // Maximum PM2.5 range for gauge filling (cap at 400 for visualization)
  const percent = Math.min(Math.max(smoothValue / 400, 0), 1);
  const strokeDashoffset = circumference - percent * circumference;

  // Pointer angle (0 rad at left, PI rad at right)
  const pointerX = cx - radius * Math.cos(Math.PI * percent);
  const pointerY = cy - radius * Math.sin(Math.PI * percent);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full relative min-h-0 py-1 select-none">
      <div className="relative flex items-center justify-center shrink min-h-0 w-full">
        {/* Subtle Ambient Radial Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl sm:blur-3xl opacity-30 pointer-events-none transition-colors duration-700"
          style={{ background: `radial-gradient(circle, ${category.glow} 0%, transparent 70%)` }}
        />

        <svg
          viewBox="0 0 420 230"
          className="w-full h-auto max-w-[280px] sm:max-w-[360px] lg:max-w-[380px] xl:max-w-[420px] max-h-[160px] sm:max-h-[190px] xl:max-h-[220px] overflow-visible relative z-10"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="25%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="gaugeSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Background Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-700/60 transition-colors duration-500"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Gradient Active Track */}
          <motion.path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            filter="url(#gaugeSoftGlow)"
          />

          {/* Indicator Tip */}
          {percent > 0.02 && (
            <motion.circle
              cx={pointerX}
              cy={pointerY}
              r={strokeWidth / 2 - 2}
              fill="#ffffff"
              stroke={category.color}
              strokeWidth="3"
              className="drop-shadow-md"
              initial={false}
              animate={{ cx: pointerX, cy: pointerY }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </svg>

        {/* Center Numbers */}
        <div className="absolute bottom-1 sm:bottom-2 xl:bottom-2.5 flex flex-col items-center pointer-events-none z-10">
          <span className="text-[10px] sm:text-[11px] xl:text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">PM2.5</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[36px] sm:text-[48px] xl:text-[60px] font-black text-slate-800 dark:text-white tracking-tighter leading-none tabular-nums transition-colors duration-300">
              {value === null ? '--' : smoothValue.toFixed(0)}
            </span>
            <span className="text-[10px] sm:text-xs xl:text-sm font-bold text-slate-500 dark:text-slate-400">µg/m³</span>
          </div>
          <span className="text-[8px] sm:text-[9px] xl:text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Kualitas Udara Realtime</span>
        </div>
      </div>

      {/* Category Pill */}
      <div className="flex flex-col items-center text-center shrink-0 mt-1.5 sm:mt-2">
        <span className="text-[9px] sm:text-[10px] xl:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1">STATUS KUALITAS UDARA</span>
        <motion.div 
          className={`px-3 py-1 sm:px-5 sm:py-1.5 xl:px-6 xl:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 ${category.bg} border shadow-2xs backdrop-blur-sm transition-all duration-500`}
          style={{ borderColor: category.color + '40' }}
          key={category.label}
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 xl:w-3 xl:h-3 rounded-full shadow-inner animate-pulse" style={{ backgroundColor: category.color }}></div>
          <span className={`text-[11px] sm:text-[13px] xl:text-[14px] font-black tracking-wider leading-none ${category.text} transition-colors duration-300`}>
            {category.label}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
