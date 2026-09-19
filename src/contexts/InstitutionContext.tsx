import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { database, ref, onValue, set, off } from '../lib/firebase';

export interface Logo {
  id: string;
  url: string;
  active: boolean;
}

export interface InstitutionSettings {
  facilityName: string;
  departmentName: string;
  location: string;
  dashboardTitle: string;
  latitude?: number;
  longitude?: number;
  useLiveGps?: boolean;
  logos: Logo[];
}

export const defaultSettings: InstitutionSettings = {
  facilityName: 'UPT PUSKESMAS BONTANG UTARA 1',
  departmentName: 'DINAS KESEHATAN KOTA BONTANG',
  location: 'Kota Bontang, Kalimantan Timur',
  dashboardTitle: 'SISTEM MONITORING KUALITAS UDARA',
  latitude: 0.1386,
  longitude: 117.4893,
  useLiveGps: true,
  logos: [
    { id: 'logo1', url: '/logo-puskesmas.svg', active: true },
    { id: 'logo2', url: '/logo-bontang.svg', active: true },
    { id: 'logo3', url: '', active: false },
    { id: 'logo4', url: '', active: false },
  ]
};

const STORAGE_KEY = 'air_monitoring_institution_settings_v2';

function getStoredSettings(): InstitutionSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const mergedLogos = defaultSettings.logos.map((defLogo, idx) => {
          const storedLogo = parsed.logos?.[idx];
          return storedLogo ? { ...defLogo, ...storedLogo } : defLogo;
        });
        return {
          ...defaultSettings,
          ...parsed,
          logos: mergedLogos,
        };
      }
    }
  } catch (e) {
    console.warn('Gagal membaca pengaturan dari localStorage:', e);
  }
  return defaultSettings;
}

function saveToLocalStorage(settings: InstitutionSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Gagal menyimpan ke localStorage:', e);
  }
}

interface InstitutionContextProps {
  settings: InstitutionSettings;
  updateSettings: (newSettings: InstitutionSettings) => Promise<void>;
  loading: boolean;
}

const InstitutionContext = createContext<InstitutionContextProps | undefined>(undefined);

export function InstitutionProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<InstitutionSettings>(() => getStoredSettings());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial sync from local storage cache for instant UI rendering
    const cachedData = getStoredSettings();
    setSettings(cachedData);

    if (!database) {
      setLoading(false);
      return;
    }

    const settingsRef = ref(database, 'settings/institution');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const cloudData = snapshot.val();
          if (cloudData && typeof cloudData === 'object') {
            // FIREBASE IS THE SOURCE OF TRUTH:
            // Build canonical logos list from cloudData (always maintaining the 4 slots structure)
            const cloudLogos = Array.isArray(cloudData.logos) ? cloudData.logos : [];
            const canonicalLogos: Logo[] = defaultSettings.logos.map((defLogo, idx) => {
              const cLogo = cloudLogos[idx];
              if (cLogo && typeof cLogo === 'object') {
                return {
                  id: cLogo.id || defLogo.id,
                  url: typeof cLogo.url === 'string' ? cLogo.url : '',
                  active: typeof cLogo.active === 'boolean' ? cLogo.active : Boolean(cLogo.url),
                };
              }
              return defLogo;
            });

            const canonicalSettings: InstitutionSettings = {
              facilityName: typeof cloudData.facilityName === 'string' ? cloudData.facilityName : defaultSettings.facilityName,
              departmentName: typeof cloudData.departmentName === 'string' ? cloudData.departmentName : defaultSettings.departmentName,
              location: typeof cloudData.location === 'string' ? cloudData.location : defaultSettings.location,
              dashboardTitle: typeof cloudData.dashboardTitle === 'string' ? cloudData.dashboardTitle : defaultSettings.dashboardTitle,
              latitude: typeof cloudData.latitude === 'number' ? cloudData.latitude : defaultSettings.latitude,
              longitude: typeof cloudData.longitude === 'number' ? cloudData.longitude : defaultSettings.longitude,
              useLiveGps: cloudData.useLiveGps !== undefined ? Boolean(cloudData.useLiveGps) : defaultSettings.useLiveGps,
              logos: canonicalLogos,
            };

            // Update both React State & localStorage CACHE
            setSettings(canonicalSettings);
            saveToLocalStorage(canonicalSettings);
          }
        } else {
          // Firebase has no settings recorded yet:
          // Use defaultSettings as baseline; never let divergent local data overwrite Firebase unprompted
          setSettings(defaultSettings);
          saveToLocalStorage(defaultSettings);
        }
      } catch (err) {
        console.warn("Kesalahan membaca data pengaturan institusi dari Firebase:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.warn("Gagal membaca pengaturan dari Firebase (menggunakan cache lokal):", error);
      setLoading(false);
    });

    return () => off(settingsRef, 'value', unsubscribe);
  }, []);

  const updateSettings = async (newSettings: InstitutionSettings) => {
    // 1. Simpan ke local state & update cache lokal untuk feedback instan
    setSettings(newSettings);
    saveToLocalStorage(newSettings);
    
    // 2. Simpan ke Firebase Realtime Database sebagai sumber kebenaran utama
    if (database) {
      try {
        const settingsRef = ref(database, 'settings/institution');
        await set(settingsRef, newSettings);
      } catch (error: any) {
        console.error("Gagal menyimpan ke Firebase Realtime Database:", error);
        throw error;
      }
    }
  };

  return (
    <InstitutionContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution() {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error('useInstitution must be used within a InstitutionProvider');
  }
  return context;
}
