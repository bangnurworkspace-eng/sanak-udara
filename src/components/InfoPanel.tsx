import { useState } from 'react';
import { MapPin, Database, Clock, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';
import { useInstitution } from '../contexts/InstitutionContext';
import { useGeolocation } from '../hooks/useGeolocation';

interface InfoPanelProps {
  updatedAt: number | string | null;
  isConnected: boolean;
}

export function InfoPanel({ updatedAt, isConnected }: InfoPanelProps) {
  const { settings } = useInstitution();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Normalisasi timestamp
  const rawTimestamp = typeof updatedAt === 'string' ? Number(updatedAt) || null : updatedAt;
  const timestampMs = rawTimestamp && rawTimestamp > 0 && rawTimestamp < 10000000000 ? rawTimestamp * 1000 : rawTimestamp;
  const dateObj = timestampMs ? new Date(timestampMs) : null;
  const isValidDate = dateObj && !isNaN(dateObj.getTime());

  // Format waktu lokal WITA (UTC+8 / Bontang)
  let formattedDateTime = '--';
  let formattedClock = '--:--:--';
  if (isValidDate) {
    try {
      const dStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);

      const tStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(dateObj).replace(/\./g, ':');

      formattedDateTime = `${dStr}, ${tStr} WITA`;
      formattedClock = `${tStr} WITA`;
    } catch {
      formattedDateTime = format(dateObj, 'd MMMM yyyy, HH:mm:ss', { locale: id }) + ' WITA';
      formattedClock = format(dateObj, 'HH:mm:ss') + ' WITA';
    }
  }

  const {
    latitude,
    longitude,
    accuracy,
    status,
    city,
    subdistrict,
    isLive,
    refreshLocation,
  } = useGeolocation();

  // Active coordinates (Live GPS or saved settings or fallback)
  const activeLat = (settings.useLiveGps && latitude !== null) ? latitude : (settings.latitude ?? 0.1386);
  const activeLon = (settings.useLiveGps && longitude !== null) ? longitude : (settings.longitude ?? 117.4893);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshLocation();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const formatCoord = (lat: number, lon: number) => {
    const latDir = lat >= 0 ? 'LU' : 'LS';
    const lonDir = lon >= 0 ? 'BT' : 'BB';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-3.5 sm:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-blue-100/60 dark:border-slate-700/60 h-full flex flex-col justify-between transition-colors duration-300 min-h-0 gap-2.5"
    >
      {/* Header Info Panel */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-xs xl:text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          INFORMASI SISTEM
        </h3>
        <button
          onClick={handleManualRefresh}
          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold"
          title="Perbarui Titik GPS"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing || status === 'loading' ? 'animate-spin text-blue-500' : ''}`} />
          <span>Refresh GPS</span>
        </button>
      </div>
      
      {/* Sensor Location Card */}
      <div className="flex flex-col gap-1.5 flex-1 justify-center min-h-0">
        <div className="flex flex-col p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-colors duration-300 shrink-0 group">
          {/* Map Preview Canvas */}
          <div className="relative h-14 sm:h-16 xl:h-18 w-full rounded-lg overflow-hidden bg-blue-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-700/50 mb-1.5">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:10px_10px] dark:bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)]"></div>
            
            {/* Map Roads & Contours */}
            <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 30 Q 30 10, 60 40 T 100 30 M20 0 L 20 100 M65 0 L 65 100 M0 70 Q 50 60, 100 80" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-blue-500" />
              <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="text-blue-400/50" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-blue-400/30" />
            </svg>

            {/* Live GPS Pin with radar ripple */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-2 bg-blue-500/30 dark:bg-blue-400/30 rounded-full animate-ping"></div>
                <div className="bg-blue-600 dark:bg-blue-500 text-white p-1 rounded-full shadow-md relative z-10">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* GPS Live Badge */}
            <div className="absolute bottom-1 left-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur text-[7.5px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span>{isLive ? 'GPS Terkunci' : 'GPS Default'}</span>
              {accuracy && <span className="text-slate-400 font-normal">±{accuracy}m</span>}
            </div>

            {/* Coordinates Badge */}
            <div className="absolute top-1 right-1.5 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur text-[7.5px] sm:text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-slate-200 border border-slate-700/50 shadow-2xs tabular-nums">
              {activeLat.toFixed(4)}, {activeLon.toFixed(4)}
            </div>
          </div>

          {/* Location Details */}
          <div className="px-1 pb-0.5 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8.5px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider">Lokasi Sensor Aktif</span>
              <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
                {formatCoord(activeLat, activeLon)}
              </span>
            </div>
            <div className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm transition-colors duration-300 leading-tight truncate">
              {settings.facilityName}
            </div>
            <div className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 transition-colors duration-300 truncate">
              {isLive && subdistrict ? `${subdistrict}, ${city}` : settings.location}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE STATUS SECTION */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 transition-colors duration-300 shrink-0">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full shadow-2xs border transition-colors ${
            isConnected 
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50' 
              : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className={`font-black text-[8.5px] sm:text-[9px] tracking-wider uppercase ${
              isConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {isConnected ? '🟢 ONLINE' : '🟡 OFFLINE'}
            </span>
          </div>
          <div className="text-right flex items-center gap-1.5">
            <Clock className={`w-3 h-3 ${isConnected ? 'text-slate-400' : 'text-amber-500/80'}`} />
            <span className={`text-xs font-black font-mono tracking-tight leading-none ${
              isConnected ? 'text-blue-700 dark:text-blue-400' : 'text-amber-800 dark:text-amber-300'
            }`}>
              {formattedClock}
            </span>
          </div>
        </div>

        <div className={`flex flex-col gap-1 px-2.5 py-1.5 rounded-lg border transition-colors duration-300 ${
          isConnected 
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100/80 dark:border-emerald-900/30' 
            : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40'
        }`}>
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Database className={`w-3 h-3 shrink-0 ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <span className={`text-[9.5px] sm:text-[10px] font-bold truncate ${
                isConnected ? 'text-slate-700 dark:text-slate-200' : 'text-amber-900 dark:text-amber-200'
              }`}>
                {isConnected ? 'Status Perangkat ESP32' : '🟡 PERANGKAT OFFLINE'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span className={`text-[8.5px] sm:text-[9px] font-black tracking-wider uppercase ${
                isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <p className={`text-[8.5px] sm:text-[9px] font-medium leading-tight ${
              isConnected ? 'text-emerald-700/90 dark:text-emerald-400/90' : 'text-amber-800 dark:text-amber-300'
            }`}>
              {isConnected ? 'Data diperbarui secara realtime.' : 'Menampilkan data terakhir yang diterima'}
            </p>
            {!isConnected && updatedAt && (
              <p className="text-[7.5px] sm:text-[8px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 leading-tight">
                Terakhir diperbarui: {formattedDateTime}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
