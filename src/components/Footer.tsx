import { useInstitution } from '../contexts/InstitutionContext';

export function Footer() {
  const { settings } = useInstitution();
  return (
    <footer className="min-h-[32px] px-3 sm:px-4 xl:px-8 py-1.5 sm:py-0 bg-blue-900 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between text-white text-[8.5px] sm:text-[9px] xl:text-[10px] font-bold tracking-widest uppercase shrink-0 shadow-inner transition-colors duration-300 gap-1 sm:gap-2 pb-safe">
      <div className="flex items-center gap-1.5">
        <span className="text-blue-300 dark:text-slate-500">Powered by</span>
        <span className="text-blue-50 dark:text-slate-300">SANAKCRAFT</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-blue-200/90 dark:text-slate-400 text-center truncate max-w-full">
        <span>Sistem Monitoring v3.2.0</span>
        <span className="text-blue-400 dark:text-slate-600 font-black">•</span>
        <span className="truncate">{settings.facilityName}</span>
      </div>
    </footer>
  );
}
