import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Maximize, Minimize, Moon, Sun, Settings } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useInstitution } from '../contexts/InstitutionContext';
import { SettingsModal } from './SettingsModal';

export function Header() {
  const { settings } = useInstitution();
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element;
        msFullscreenElement?: Element;
      };
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement));
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element;
      msFullscreenElement?: Element;
    };

    const isCurrentlyFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);

    if (!isCurrentlyFullscreen) {
      const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
      if (requestFS) {
        try {
          const promise = requestFS.call(docEl);
          if (promise && promise.catch) {
            promise.catch(err => {
              console.warn(`Fullscreen error: ${err.message}`);
            });
          }
        } catch (e) {
          console.warn('Fullscreen request failed', e);
        }
      }
    } else {
      const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      if (exitFS) {
        exitFS.call(doc);
      }
    }
  };

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const timeString = format(time, 'HH:mm:ss');
  const dateString = format(time, 'dd MMM yyyy');
  const dayString = format(time, 'EEEE');

  const activeLogos = settings.logos.filter(l => l.active && l.url);

  return (
    <>
      <header className="sticky top-0 z-30 min-h-[58px] sm:min-h-[64px] lg:h-[70px] xl:h-[76px] px-2.5 sm:px-4 xl:px-6 py-1.5 sm:py-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-blue-100/80 dark:border-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.03)] shrink-0 transition-colors duration-300 flex items-center justify-between gap-2 sm:gap-3 pt-safe">
        
        {/* Left: Logos */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 max-w-[20%] sm:max-w-[25%] xl:max-w-[280px]">
          {activeLogos.map((logo, index) => (
            <img 
              key={logo.id || index}
              src={logo.url} 
              alt={`Logo ${index + 1}`} 
              referrerPolicy="no-referrer"
              className="w-7 h-7 sm:w-9 sm:h-9 xl:w-[44px] xl:h-[44px] object-contain drop-shadow-xs shrink-0" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ))}
        </div>

        {/* Center: Title and Institution Details */}
        <div className="flex flex-col items-center justify-center flex-1 text-center min-w-0 px-1">
          <h1 className="text-xs sm:text-base md:text-lg xl:text-[22px] font-black text-blue-900 dark:text-blue-400 tracking-tight leading-tight drop-shadow-xs transition-colors duration-300 truncate max-w-full">
            {settings.dashboardTitle}
          </h1>
          <h2 className="text-[7.5px] sm:text-[9px] xl:text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-wider uppercase transition-colors duration-300 truncate max-w-full">
            {settings.facilityName} <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> {settings.departmentName}
          </h2>
        </div>

        {/* Right: Actions & Clock */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 xl:gap-4 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-blue-500 shrink-0 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center" 
              title="Pengaturan"
              aria-label="Buka Pengaturan"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={toggleDarkMode} 
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-blue-500 shrink-0 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center" 
              title="Ganti Tema"
              aria-label="Ganti Tema Gelap Terang"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button 
              onClick={toggleFullscreen} 
              className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-blue-500 shrink-0 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] items-center justify-center" 
              title="Layar Penuh"
              aria-label="Layar Penuh"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>

          <div className="flex flex-col items-end shrink-0 pl-1 border-l border-slate-200 dark:border-slate-800">
            <div className="text-xs sm:text-base xl:text-xl font-mono font-black text-blue-900 dark:text-blue-400 leading-none tabular-nums transition-colors duration-300">
              {timeString}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="text-[7.5px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300 whitespace-nowrap hidden xs:inline">
                {dayString}, {dateString}
              </div>
              <div className="flex items-center gap-0.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-1 py-0.2 rounded-full shadow-2xs transition-colors duration-300 shrink-0">
                <div className="w-1.2 h-1.2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse shrink-0"></div>
                <span className="text-[7px] sm:text-[8px] font-black text-green-700 dark:text-green-400 tracking-wider">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
