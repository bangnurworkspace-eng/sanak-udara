/**
 * Helper to compress and optimize uploaded logo images to clean, lightweight Data URLs.
 * Keeps SVGs intact, and resizes large PNG/JPEG/WEBP images to fit within max dimensions
 * while preserving transparency and quality.
 */
export async function optimizeLogoImage(file: File, maxDimension = 400): Promise<string> {
  // If it's an SVG, read directly as text or data URL
  if (file.type === 'image/svg+xml') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear and draw image with alpha channel preserved
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight PNG data URL (preserving transparency)
        const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memuat format gambar.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to compress and optimize uploaded logo images to a clean, lightweight Blob for Firebase Storage.
 * Keeps SVGs intact as SVG Blobs, and resizes large PNG/JPEG/WEBP images to fit within max dimensions
 * while preserving transparency and high quality.
 */
export async function optimizeLogoToBlob(
  file: File,
  maxDimension = 400
): Promise<{ blob: Blob; contentType: string; extension: string }> {
  if (file.type === 'image/svg+xml') {
    return {
      blob: file,
      contentType: 'image/svg+xml',
      extension: 'svg'
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ blob: file, contentType: file.type || 'image/png', extension: 'png' });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, contentType: 'image/png', extension: 'png' });
            } else {
              resolve({ blob: file, contentType: file.type || 'image/png', extension: 'png' });
            }
          },
          'image/png',
          0.92
        );
      };
      img.onerror = () => reject(new Error('Gagal memuat format gambar.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
