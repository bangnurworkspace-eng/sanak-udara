import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Trash2, CheckCircle2, AlertCircle, MapPin, Navigation, RefreshCw, Image as ImageIcon, Lock, User, Key } from 'lucide-react';
import { useInstitution, defaultSettings, InstitutionSettings, Logo } from '../contexts/InstitutionContext';
import { optimizeLogoImage, optimizeLogoToBlob } from '../utils/imageUtils';
import { storage, storageRef, uploadBytes, getDownloadURL, deleteObject } from '../lib/firebase';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useInstitution();
  const [formData, setFormData] = useState<InstitutionSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const adminId = (import.meta.env.VITE_ADMIN_ID && import.meta.env.VITE_ADMIN_ID !== '') ? import.meta.env.VITE_ADMIN_ID : 'sanak';
    const adminPassword = (import.meta.env.VITE_ADMIN_PASSWORD && import.meta.env.VITE_ADMIN_PASSWORD !== '') ? import.meta.env.VITE_ADMIN_PASSWORD : 'bontanggueee';

    if (loginId.trim() === adminId && loginPassword === adminPassword) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('ID atau Password salah!');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoToggle = (index: number) => {
    setFormData(prev => {
      const newLogos = [...prev.logos];
      newLogos[index] = { ...newLogos[index], active: !newLogos[index].active };
      return { ...prev, logos: newLogos };
    });
  };

  const handleLogoRemove = (index: number) => {
    setFormData(prev => {
      const newLogos = [...prev.logos];
      newLogos[index] = { ...newLogos[index], url: '', active: false };
      return { ...prev, logos: newLogos };
    });
  };

  const handleLogoUpload = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validasi file gambar
    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|svg|webp)$/i)) {
      alert("Harap pilih file gambar yang valid (PNG, JPG, SVG, WebP).");
      e.target.value = '';
      return;
    }

    setUploadingSlot(index);
    try {
      // 2. Kompres/optimalkan gambar (menjaga transparansi PNG/SVG dan dimensi max 400px)
      const { blob, contentType, extension } = await optimizeLogoToBlob(file, 400);

      let uploadedUrl = '';
      const oldLogoUrl = formData.logos[index]?.url;

      // 3. Upload ke Firebase Storage jika storage aktif
      if (storage) {
        const timestamp = Date.now();
        const storagePath = `institution/logos/logo_${index + 1}_${timestamp}.${extension}`;
        const fileRef = storageRef(storage, storagePath);

        const uploadSnapshot = await uploadBytes(fileRef, blob, { contentType });
        uploadedUrl = await getDownloadURL(uploadSnapshot.ref);
      } else {
        // Fallback ke data URL teroptimasi jika storage belum diaktifkan
        uploadedUrl = await optimizeLogoImage(file, 400);
      }

      // 4. Update formData logos
      const newLogos = [...formData.logos];
      newLogos[index] = {
        ...newLogos[index],
        url: uploadedUrl,
        active: true,
      };

      const updatedFormData: InstitutionSettings = { ...formData, logos: newLogos };
      setFormData(updatedFormData);

      // 5. Langsung simpan ke Firebase Realtime Database agar tersinkronisasi ke seluruh perangkat
      await updateSettings(updatedFormData);

      // 6. Hapus file logo lama di Firebase Storage jika ada dan berasal dari Firebase Storage
      if (oldLogoUrl && storage && oldLogoUrl.includes('firebasestorage')) {
        try {
          const oldRef = storageRef(storage, oldLogoUrl);
          deleteObject(oldRef).catch(() => {});
        } catch {
          // Abaikan error penghapusan file lama
        }
      }
    } catch (error) {
      console.error("Error uploading logo to Firebase:", error);
      alert("Gagal mengunggah logo. Pastikan koneksi internet stabil.");
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Peramban tidak mendukung Geolocation.');
      return;
    }

    setGpsStatus('detecting');
    setGpsMessage('Mencari sinyal GPS...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          useLiveGps: true,
        }));

        setGpsStatus('success');
        setGpsMessage(`Lokasi terdeteksi! (Akurasi: ±${Math.round(accuracy)}m)`);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.county || 'Kota Bontang';
            const district = addr.suburb || addr.village || addr.municipality || '';
            const locName = district ? `${district}, ${city}` : city;
            setFormData(prev => ({
              ...prev,
              location: locName
            }));
          }
        } catch (e) {
          console.warn(e);
        }
      },
      (err) => {
        setGpsStatus('error');
        setGpsMessage(err.code === 1 ? 'Izin akses GPS ditolak.' : 'Gagal mendeteksi koordinat GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateSettings(formData);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan pengaturan ke konfigurasi awal?')) {
      setFormData(defaultSettings);
      try {
        await updateSettings(defaultSettings);
      } catch (error) {
        console.warn("Gagal mereset ke Firebase:", error);
      }
    }
  };

  const activeLogosPreview = formData.logos.filter(l => l.active && l.url);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-md pb-safe"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Pengaturan Dashboard
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Footer Wrapper based on Auth */}
        {!isAuthenticated ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Otorisasi Admin</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Silakan masukkan kredensial untuk mengakses pengaturan.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Admin ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                      placeholder="Masukkan Admin ID"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <input 
                      type="password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                      placeholder="Masukkan Password"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Buka Pengaturan
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
              
              {/* Section: Identitas */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Identitas Instansi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Judul Dashboard</label>
                <input 
                  type="text" 
                  name="dashboardTitle"
                  value={formData.dashboardTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Contoh: SISTEM MONITORING KUALITAS UDARA"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Instansi</label>
                <input 
                  type="text" 
                  name="facilityName"
                  value={formData.facilityName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Contoh: UPT Puskesmas Bontang Utara"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Dinas</label>
                <input 
                  type="text" 
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Contoh: Dinas Kesehatan Kota Bontang"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Tempat / Wilayah</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Contoh: Kota Bontang, Kalimantan Timur"
                />
              </div>
            </div>
          </section>

          {/* Section: Koordinat GPS Sensor */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500" />
                Titik Koordinat GPS Sensor
              </h3>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={gpsStatus === 'detecting'}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsStatus === 'detecting' ? 'animate-spin' : ''}`} />
                <span>{gpsStatus === 'detecting' ? 'Mendeteksi...' : 'Ambil Lokasi Saya Sekarang'}</span>
              </button>
            </div>

            {gpsMessage && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${gpsStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800' : gpsStatus === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                {gpsStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{gpsMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  name="latitude"
                  value={formData.latitude ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Contoh: 0.1386"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  name="longitude"
                  value={formData.longitude ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Contoh: 117.4893"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox"
                id="useLiveGpsCheckbox"
                checked={formData.useLiveGps ?? true}
                onChange={(e) => setFormData(prev => ({ ...prev, useLiveGps: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="useLiveGpsCheckbox" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Gunakan sinkronisasi GPS langsung dari sensor/perangkat pemantau
              </label>
            </div>
          </section>

          {/* Section: Logo */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                Logo Instansi (Maks. 4 Logo)
              </h3>
              <span className="text-xs text-slate-400">Format: PNG, JPG, SVG, WebP</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.logos.map((logo, index) => (
                <div key={logo.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="h-20 w-full flex items-center justify-center relative group bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden shadow-2xs">
                    {uploadingSlot === index ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] text-blue-600 font-medium">Memproses...</span>
                      </div>
                    ) : logo.url ? (
                      <img 
                        src={logo.url} 
                        alt={`Logo ${index + 1}`} 
                        className={`max-h-full max-w-full object-contain p-2 transition-all ${!logo.active && 'opacity-30 grayscale'}`} 
                        onError={(e) => {
                          // Jika url gambar gagal/rusak
                          (e.target as HTMLImageElement).style.opacity = '0.3';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <Upload className="w-5 h-5 opacity-40" />
                        <span className="text-[10px] font-semibold">Slot {index + 1} Kosong</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center gap-1.5 w-full">
                    <label 
                      className="relative cursor-pointer px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 overflow-hidden"
                      title={logo.url ? "Ganti Logo" : "Upload Logo"}
                    >
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp, image/svg+xml" 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        onChange={(e) => handleLogoUpload(index, e)}
                        disabled={uploadingSlot !== null}
                      />
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logo.url ? 'Ganti' : 'Pilih'}</span>
                    </label>
                    
                    {logo.url && (
                      <>
                        <button 
                          type="button"
                          onClick={() => handleLogoToggle(index)}
                          className={`px-2 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors ${logo.active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}
                          title={logo.active ? "Sembunyikan Logo" : "Tampilkan Logo"}
                        >
                          {logo.active ? 'AKTIF' : 'NONAKTIF'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleLogoRemove(index)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg transition-colors"
                          title="Hapus Logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Preview Header */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview Header</h3>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center">
              
              <div className="flex items-center gap-4 text-center max-w-full overflow-hidden">
                <div className="flex items-center gap-2 shrink-0">
                  {activeLogosPreview.map((logo, index) => (
                    <img 
                      key={logo.id || index}
                      src={logo.url} 
                      alt="Logo Preview" 
                      className="w-10 h-10 object-contain drop-shadow-sm" 
                    />
                  ))}
                </div>
                
                <div className="flex flex-col items-center justify-center flex-1 min-w-0">
                  <h1 className="text-lg md:text-xl font-black text-blue-800 dark:text-blue-400 tracking-tight leading-none drop-shadow-sm truncate max-w-full">
                    {formData.dashboardTitle || 'JUDUL KOSONG'}
                  </h1>
                  <h2 className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 tracking-widest uppercase truncate max-w-full">
                    {formData.facilityName || 'INSTANSI KOSONG'} <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> {formData.departmentName || 'DINAS KOSONG'}
                  </h2>
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <button 
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors text-center"
          >
            Reset Pengaturan
          </button>
          
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            {saveStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" /> Tersimpan
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" /> Gagal
              </span>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </div>
        </>
        )}

      </motion.div>
    </motion.div>
  );
}
