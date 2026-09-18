import { useEffect, useState } from 'react';
import { database, ref, onValue, off, firebaseConfig } from '../lib/firebase';

export interface AirQualityData {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  pm1: number | null;
  pm25: number | null;
  pm10: number | null;
  status: string | null;
  device_id: string | null;
  updated_at: number | null;
}

export function useAirQualityData() {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Debug info
  const debugInfo = {
    projectId: firebaseConfig?.projectId,
    databaseUrl: firebaseConfig?.databaseURL,
    path: 'monitoring_udara/Puskesmas_Bontang_Utara_1'
  };

  useEffect(() => {
    if (!database) {
      setError("Firebase connection error (Config missing)");
      setLoading(false);
      return;
    }

    const dbRef = ref(database, 'monitoring_udara/Puskesmas_Bontang_Utara_1');

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        
        // Cek status online berdasarkan updated_at (misal data dikirim maks 2 menit lalu = 120000ms)
        const lastUpdated = val.updated_at || 0;
        const now = Date.now();
        const isDeviceOnline = (now - lastUpdated) < 120000; // 2 Menit threshold online
        
        setIsConnected(isDeviceOnline);
        
        setData({
          temperature: val.temperature ?? null,
          humidity: val.humidity ?? null,
          pressure: val.pressure ?? null,
          pm1: val.pm1 ?? null,
          pm25: val.pm25 ?? null,
          pm10: val.pm10 ?? null,
          status: val.status ?? null,
          device_id: val.device_id ?? null,
          updated_at: val.updated_at ?? null,
        });
        setError(null);
      } else {
        setData(null);
        setIsConnected(false);
        setError(null);
      }
      setLoading(false);
    }, (err: any) => {
      console.error("Firebase connection error:", err);
      setErrorCode(err.code || err.message);
      setIsConnected(false);
      
      if (err.message && err.message.includes("permission_denied")) {
        setError(`Akses ditolak (permission_denied): Periksa kembali tab Rules Firebase di proyek sanak-udara.`);
      } else {
        setError("Koneksi Firebase terputus: " + err.message);
      }
      
      setLoading(false);
    });

    // Tambahkan interval untuk mengecek status offline secara berkala
    const checkOnlineStatus = setInterval(() => {
      setData((prevData) => {
        if (!prevData || !prevData.updated_at) return prevData;
        const now = Date.now();
        const isDeviceOnline = (now - prevData.updated_at) < 120000;
        setIsConnected(isDeviceOnline);
        return prevData;
      });
    }, 30000); // Cek tiap 30 detik

    return () => {
      off(dbRef, 'value', unsubscribe);
      clearInterval(checkOnlineStatus);
    };
  }, []);

  return { data, loading, error, errorCode, isConnected, debugInfo };
}
