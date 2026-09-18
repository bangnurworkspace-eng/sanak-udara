import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSmoothValue } from '../hooks/useSmoothValue';

interface SensorCardProps {
  icon: ReactNode;
  title: string;
  value: number | null;
  unit: string;
  delay?: number;
  descriptions?: string[];
}

export function SensorCard({ icon, title, value, unit, delay = 0, descriptions }: SensorCardProps) {
  const smoothValue = useSmoothValue(value ?? 0, 600);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-2.5 sm:p-3.5 lg:p-4 xl:p-5 flex flex-col justify-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-blue-100/60 dark:border-slate-700/60 hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-all duration-200 relative overflow-hidden group h-full min-h-[85px] sm:min-h-[100px] lg:min-h-[110px] xl:min-h-0 select-none"
    >
      {/* Decorative gradient corner */}
      <div className="absolute -top-10 -right-10 w-20 h-20 sm:w-24 sm:h-24 bg-blue-50/70 dark:bg-blue-900/20 rounded-full blur-xl group-hover:bg-blue-100/80 dark:group-hover:bg-blue-800/30 transition-colors duration-500 pointer-events-none" />
      
      <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10 w-full h-full min-h-0">
        <div className="p-2 sm:p-2.5 xl:p-3 bg-blue-50/90 dark:bg-slate-700/90 text-blue-600 dark:text-blue-400 rounded-lg lg:rounded-xl group-hover:scale-105 group-hover:bg-blue-100 dark:group-hover:bg-slate-600 transition-all duration-300 shrink-0 shadow-2xs flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center overflow-hidden">
          <span className="text-[9px] sm:text-[10px] xl:text-[12px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase truncate leading-tight">
            {title}
          </span>
          <div className="flex items-baseline gap-1.5 w-full my-0.5 sm:my-1">
            <span className="text-[22px] sm:text-[28px] lg:text-[32px] xl:text-[38px] font-black text-slate-800 dark:text-white tracking-tight tabular-nums leading-none transition-colors duration-300">
              {value === null ? '--' : (Number.isInteger(value) ? smoothValue.toFixed(0) : smoothValue.toFixed(1))}
            </span>
            <span className="text-[10px] sm:text-[12px] xl:text-[14px] font-bold text-slate-400 dark:text-slate-500 tracking-wide truncate">
              {unit}
            </span>
          </div>
          {descriptions && descriptions.length > 0 && (
            <div className="flex flex-col gap-0.5 overflow-hidden">
              {descriptions.map((desc, idx) => (
                <span key={idx} className="text-[8.5px] sm:text-[10px] xl:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate">
                  {desc}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
