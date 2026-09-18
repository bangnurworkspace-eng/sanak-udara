import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  status: 'idle' | 'loading' | 'success' | 'error' | 'denied';
  errorMessage: string | null;
  address: string | null;
  city: string | null;
  subdistrict: string | null;
  isLive: boolean;
}

// Koordinat default UPT Puskesmas Bontang Utara 1
const DEFAULT_LATITUDE = 0.1386;
const DEFAULT_LONGITUDE = 117.4893;

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeolocationState>({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    accuracy: null,
    status: 'idle',
    errorMessage: null,
    address: 'Bontang Utara, Kota Bontang',
    city: 'Kota Bontang',
    subdistrict: 'Bontang Utara',
    isLive: false,
  });

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id,en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const addressObj = data.address || {};
        const district =
          addressObj.suburb ||
          addressObj.village ||
          addressObj.municipality ||
          addressObj.county ||
          '';
        const city =
          addressObj.city ||
          addressObj.town ||
          addressObj.county ||
          'Kota Bontang';
        const state = addressObj.state || '';
        const fullAddr = data.display_name || `${district}, ${city}`;

        setGeoState((prev) => ({
          ...prev,
          address: fullAddr,
          city: city,
          subdistrict: district || city,
        }));
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Geolocation tidak didukung oleh browser ini',
      }));
      return;
    }

    setGeoState((prev) => ({
      ...prev,
      status: 'loading',
      errorMessage: null,
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGeoState({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          status: 'success',
          errorMessage: null,
          address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
          city: 'Lokasi Terdeteksi',
          subdistrict: 'GPS Aktif',
          isLive: true,
        });

        // Lakukan reverse geocoding untuk mendapatkan nama tempat akurat
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        let msg = 'Gagal mendeteksi lokasi';
        let status: 'denied' | 'error' = 'error';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Izin akses lokasi GPS ditolak';
            status = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            msg = 'Waktu permintaan lokasi habis';
            break;
        }

        setGeoState((prev) => ({
          ...prev,
          status,
          errorMessage: msg,
          isLive: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...geoState,
    refreshLocation: requestLocation,
  };
}
