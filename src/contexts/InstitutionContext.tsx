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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial sync from local storage
    const localData = getStoredSettings();
    setSettings(localData);

    if (!database) {
      setLoading(false);
      return;
    }

    const settingsRef = ref(database, 'settings/institution');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Dapatkan data local storage saat ini
        const currentLocal = getStoredSettings();

        // Merge logic: jika firebase memiliki logo url, gunakan; 
        // namun jika firebase kosong pada slot tertentu tetapi local memiliki url buatan user, pertahankan local!
        let mergedLogos = defaultSettings.logos.map((defLogo, idx) => {
          const cloudLogo = data.logos?.[idx];
          const localLogo = currentLocal.logos?.[idx];

          if (cloudLogo && cloudLogo.url) {
            return { ...defLogo, ...cloudLogo };
          }
          if (localLogo && localLogo.url) {
            return { ...defLogo, ...localLogo };
          }
          return cloudLogo ? { ...defLogo, ...cloudLogo } : defLogo;
        });

        const mergedSettings: InstitutionSettings = {
          ...defaultSettings,
          ...currentLocal,
          ...data,
          logos: mergedLogos,
        };

        setSettings(mergedSettings);
        saveToLocalStorage(mergedSettings);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Gagal membaca pengaturan dari Firebase:", error);
      setLoading(false);
    });

    return () => off(settingsRef, 'value', unsubscribe);
  }, []);

  const updateSettings = async (newSettings: InstitutionSettings) => {
    // 1. Simpan ke local storage & state langsung (instan & permanen di browser)
    setSettings(newSettings);
    saveToLocalStorage(newSettings);
    
    if (!database) {
      return;
    }
    
    // 2. Simpan ke Firebase Realtime Database
    try {
      const settingsRef = ref(database, 'settings/institution');
      await set(settingsRef, newSettings);
    } catch (error: any) {
      console.warn("Gagal menyimpan ke Firebase Realtime Database:", error);
      // Jangan lempar error jika hanya masalah aturan keamanan agar UI tetap sukses tersimpan secara lokal
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
