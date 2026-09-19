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

// 30 detik threshold untuk status ONLINE/OFFLINE
const ONLINE_THRESHOLD_MS = 30000;

export function isDeviceTimestampOnline(timestamp: number | null | undefined): boolean {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) return false;
  const tsMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const age = Date.now() - tsMs;
  // Toleransi -60s jika ada selisih jam masa depan ESP32 dan batas 30s ke belakang
  return age >= -60000 && age <= ONLINE_THRESHOLD_MS;
}

export function useAirQualityData() {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Debug info
  const debugInfo = {
    projectId: firebaseConfig?.projectId || 'sanak-udara',
    databaseUrl: firebaseConfig?.databaseURL || 'https://sanak-udara-default-rtdb.asia-southeast1.firebasedatabase.app',
    path: 'monitoring_udara/Puskesmas_Bontang_Utara_1'
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutTimer: NodeJS.Timeout | null = null;

    if (!database) {
      setError("Firebase connection error: Database instance tidak tersedia.");
      setErrorCode("DATABASE_NOT_INITIALIZED");
      setLoading(false);
      return;
    }

    const dbPath = 'monitoring_udara/Puskesmas_Bontang_Utara_1';
    const dbRef = ref(database, dbPath);

    // Timeout keamanan maksimal 10 detik agar loading spinner tidak macet selamanya
    // Catatan: Ini HANYA pengaman loading UI, BUKAN indikator perangkat offline
    timeoutTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (!isMounted) return;

        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }

        if (snapshot.exists()) {
          const val = snapshot.val();
          
          if (val && typeof val === 'object') {
            let lastUpdated = typeof val.updated_at === 'number' 
              ? val.updated_at 
              : (val.updated_at ? Number(val.updated_at) : 0);
            
            // Normalisasi jika timestamp tersimpan dalam detik (10 digit)
            if (lastUpdated > 0 && lastUpdated < 10000000000) {
              lastUpdated = lastUpdated * 1000;
            }

            // Hitung status ONLINE berdasarkan umur updated_at (<= 30 detik = ONLINE, > 30 detik = OFFLINE)
            const deviceOnline = isDeviceTimestampOnline(lastUpdated);
            setIsConnected(deviceOnline);

            // Selalu simpan seluruh data sensor terakhir yang ada di Firebase
            setData({
              temperature: typeof val.temperature === 'number' ? val.temperature : (val.temperature !== undefined && val.temperature !== null ? Number(val.temperature) : null),
              humidity: typeof val.humidity === 'number' ? val.humidity : (val.humidity !== undefined && val.humidity !== null ? Number(val.humidity) : null),
              pressure: typeof val.pressure === 'number' ? val.pressure : (val.pressure !== undefined && val.pressure !== null ? Number(val.pressure) : null),
              pm1: typeof val.pm1 === 'number' ? val.pm1 : (val.pm1 !== undefined && val.pm1 !== null ? Number(val.pm1) : null),
              pm25: typeof val.pm25 === 'number' ? val.pm25 : (val.pm25 !== undefined && val.pm25 !== null ? Number(val.pm25) : null),
              pm10: typeof val.pm10 === 'number' ? val.pm10 : (val.pm10 !== undefined && val.pm10 !== null ? Number(val.pm10) : null),
              status: val.status ? String(val.status) : null,
              device_id: val.device_id ? String(val.device_id) : 'Puskesmas_Bontang_Utara_1',
              updated_at: lastUpdated || null,
            });

            // Berhasil menerima snapshot data dari Firebase: bersihkan pesan error
            setError(null);
            setErrorCode(null);
          }
        } else {
          // Node data belum dibuat sama sekali di path Firebase
          setIsConnected(false);
        }

        setLoading(false);
      },
      (err: any) => {
        if (!isMounted) return;

        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }

        console.warn("Firebase realtime error:", err);
        setErrorCode(err?.code || err?.message || "CONNECTION_ERROR");

        // Pertahankan data sensor terakhir jika sebelumnya sudah ada
        setData((prev) => {
          if (!prev) {
            if (err?.message && err.message.includes("permission_denied")) {
              setError("Akses ditolak (permission_denied): Periksa kembali tab Rules Firebase di proyek sanak-udara.");
            } else {
              setError("Koneksi Firebase terputus: " + (err?.message || "Gagal memuat data sensor"));
            }
          }
          return prev;
        });

        setLoading(false);
      }
    );

    // Interval evaluasi status ONLINE/OFFLINE berkala setiap 1 detik secara dinamis
    // Jika 30 detik terlewati tanpa ada paket baru, otomatis beralih ke OFFLINE tanpa menghapus data
    const checkOnlineStatus = setInterval(() => {
      if (!isMounted) return;
      setData((prevData) => {
        if (!prevData || !prevData.updated_at) {
          setIsConnected(false);
          return prevData;
        }
        const deviceOnline = isDeviceTimestampOnline(prevData.updated_at);
        setIsConnected(deviceOnline);
        return prevData; // Nilai sensor tetap dipertahankan
      });
    }, 1000);

    return () => {
      isMounted = false;
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      clearInterval(checkOnlineStatus);
      off(dbRef, 'value', unsubscribe);
    };
  }, []);

  return { data, loading, error, errorCode, isConnected, debugInfo };
}

