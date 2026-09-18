import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GaugeMeter } from './components/GaugeMeter';
import { SensorCard } from './components/SensorCard';
import { HealthRecommendation } from './components/HealthRecommendation';
import { InfoPanel } from './components/InfoPanel';
import { useAirQualityData } from './hooks/useAirQualityData';
import { Thermometer, Droplets, Wind, CloudFog, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const { data, loading, error, errorCode, isConnected, debugInfo } = useAirQualityData();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-grid-pattern relative select-none p-4">
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md z-0 transition-colors duration-500"></div>
        <div className="z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-widest uppercase">MEMUAT SISTEM</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">Menunggu data sensor...</p>
        </div>
      </div>
    );
  }

  // Calculate subtle ambient glow based on PM2.5
  const getAmbientGlow = (val: number | null) => {
    if (val === null) return 'rgba(148, 163, 184, 0.05)';
    if (val <= 50) return 'rgba(34, 197, 94, 0.08)'; // Green
    if (val <= 100) return 'rgba(59, 130, 246, 0.08)'; // Blue
    if (val <= 200) return 'rgba(234, 179, 8, 0.08)'; // Yellow
    if (val <= 300) return 'rgba(239, 68, 68, 0.08)'; // Red
    return 'rgba(15, 23, 42, 0.1)'; // Dark Slate/Black
  };

  const ambientColor = getAmbientGlow(data?.pm25 ?? null);

  return (
    <div className="min-h-screen lg:fixed lg:inset-0 lg:h-screen flex flex-col lg:grid lg:grid-rows-[70px_1fr_32px] xl:grid-rows-[76px_1fr_32px] font-sans bg-slate-50/80 dark:bg-[#0b0f19] transition-colors duration-500 overflow-x-hidden">
      {/* Dynamic Ambient Background Illumination */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0"
        style={{
          background: `radial-gradient(circle at 25% 30%, ${ambientColor} 0%, transparent 60%), radial-gradient(circle at 75% 70%, rgba(59, 130, 246, 0.04) 0%, transparent 50%)`
        }}
      />
      
      {/* Background Micro Grid */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 dark:opacity-20 pointer-events-none z-0"></div>
      
      <Header />
      
      {/* Main Content Area */}
      <main className="flex-1 p-2.5 sm:p-3.5 lg:p-3 xl:p-4 flex flex-col lg:grid gap-2.5 lg:gap-3 xl:gap-3.5 w-full relative z-10 lg:overflow-hidden custom-scrollbar" style={{ gridTemplateRows: error ? 'auto minmax(0, 65fr) minmax(0, 35fr)' : 'minmax(0, 65fr) minmax(0, 35fr)' }}>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full bg-red-50/90 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl p-3 flex flex-col gap-3 backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300 leading-snug">{error}</p>
            </div>
            {/* Debug Info (Temporary) */}
            <div className="mt-2 bg-slate-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              <p>Firebase Project ID: {debugInfo?.projectId}</p>
              <p>Firebase Database URL: {debugInfo?.databaseUrl}</p>
              <p>Firebase Path: {debugInfo?.path}</p>
              <p>Connection: {isConnected ? 'CONNECTED' : 'ERROR'}</p>
              <p>Firebase Error Code: {errorCode || 'N/A'}</p>
            </div>
          </motion.div>
        )}

        {/* Top Section (Gauge + Sensors) */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-blue-100/60 dark:border-slate-700/60 p-3.5 sm:p-4 xl:p-5 flex flex-col lg:flex-row items-stretch transition-colors duration-300 min-h-0 lg:overflow-hidden gap-3 lg:gap-0"
        >
          {/* Gauge PM2.5 (Focus Utama) */}
          <div className="w-full lg:w-[320px] xl:w-[380px] 2xl:w-[420px] flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700/70 pb-3 lg:pb-0 lg:pr-4 xl:pr-5 shrink-0 min-h-[220px] sm:min-h-[250px] lg:min-h-0 lg:overflow-hidden">
            <GaugeMeter value={data?.pm25 ?? null} />
          </div>
          
          {/* Card Sensors Grid */}
          <div className="flex-1 flex flex-col justify-center pt-1 lg:pt-0 lg:pl-4 xl:pl-5 min-h-0 lg:overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 lg:gap-3 xl:gap-3.5 min-h-0">
              <SensorCard icon={<Thermometer className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />} title="Suhu" value={data?.temperature ?? null} unit="°C" delay={1} />
              <SensorCard icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />} title="Kelembapan" value={data?.humidity ?? null} unit="%" delay={2} />
              <SensorCard icon={<Wind className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />} title="Tekanan" value={data?.pressure ?? null} unit="hPa" delay={3} />
              <SensorCard icon={<CloudFog className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />} title="PM1.0" value={data?.pm1 ?? null} unit="µg/m³" delay={4} descriptions={["Partikel Halus"]} />
              <SensorCard icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />} title="PM2.5" value={data?.pm25 ?? null} unit="µg/m³" delay={5} descriptions={["Polusi Udara"]} />
              <SensorCard icon={<CloudFog className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />} title="PM10" value={data?.pm10 ?? null} unit="µg/m³" delay={6} descriptions={["Debu Lingkungan"]} />
            </div>
          </div>
        </motion.section>

        {/* Bottom Section (Health Recommendation + Info) */}
        <section className="flex flex-col lg:grid lg:grid-cols-12 gap-2.5 lg:gap-3 xl:gap-3.5 min-h-0 lg:overflow-hidden">
          <div className="lg:col-span-8 xl:col-span-7 min-h-0 lg:overflow-hidden">
            <HealthRecommendation currentData={data} />
          </div>
          <div className="lg:col-span-4 xl:col-span-5 min-h-0 lg:overflow-hidden">
            <InfoPanel updatedAt={data?.updated_at ?? null} isConnected={isConnected} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
