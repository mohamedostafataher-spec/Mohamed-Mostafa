/**
 * SULTA Client-Side 4K & WebP Image Optimizer
 *
 * Automatically processes images in browser before upload to Supabase Storage:
 * - Resizes to 4K-ready dimensions (up to 2160px width for portrait / 3840px for banners)
 * - Applies subtle unsharp masking for fabric texture & lace clarity
 * - Converts cleanly to optimized WebP format with compression statistics
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetFormat?: 'image/webp' | 'image/jpeg';
  applySharpen?: boolean;
}

export interface OptimizedImageResult {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  savedPercent: number;
  width: number;
  height: number;
  format: string;
}

export async function optimizeImageWithStats(
  file: File,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 2160,
    maxHeight = 3840,
    quality = 0.86,
    targetFormat = 'image/webp',
    applySharpen = true
  } = options;

  const originalBytes = file.size;

  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalBytes,
      compressedBytes: file.size,
      savedPercent: 0,
      width: 0,
      height: 0,
      format: file.type || 'unknown'
    };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    let targetW = width;
    let targetH = height;

    if (width > height) {
      if (width > 3840) {
        targetW = 3840;
        targetH = Math.round((3840 / width) * height);
      }
    } else {
      if (width > maxWidth) {
        targetW = maxWidth;
        targetH = Math.round((maxWidth / width) * height);
      }
      if (targetH > maxHeight) {
        targetH = maxHeight;
        targetW = Math.round((maxHeight / height) * width);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: applySharpen });
    if (!ctx) {
      bitmap.close();
      return {
        file,
        originalBytes,
        compressedBytes: file.size,
        savedPercent: 0,
        width,
        height,
        format: file.type
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    if (applySharpen && targetW <= 2160) {
      try {
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;
        const copy = new Uint8ClampedArray(data);
        const w = targetW;
        const h = targetH;
        const amount = 0.16;

        for (let y = 1; y < h - 1; y += 2) {
          for (let x = 1; x < w - 1; x += 2) {
            const idx = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
              const current = copy[idx + c];
              const top = copy[((y - 1) * w + x) * 4 + c];
              const bottom = copy[((y + 1) * w + x) * 4 + c];
              const left = copy[(y * w + (x - 1)) * 4 + c];
              const right = copy[(y * w + (x + 1)) * 4 + c];
              const blur = (top + bottom + left + right) * 0.25;
              const sharpened = current + (current - blur) * amount;
              data[idx + c] = Math.min(255, Math.max(0, sharpened));
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Non-fatal
      }
    }

    const optimizedFile = await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const isWebP = blob.type === 'image/webp' || targetFormat === 'image/webp';
          const ext = isWebP ? 'webp' : 'jpg';
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
          const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'sulta';
          const newFileName = `${safeBase}_webp.${ext}`;
          resolve(new File([blob], newFileName, { type: blob.type || targetFormat }));
        },
        targetFormat,
        quality
      );
    });

    const compressedBytes = optimizedFile.size;
    const savedPercent =
      originalBytes > 0 ? Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100)) : 0;

    return {
      file: optimizedFile,
      originalBytes,
      compressedBytes,
      savedPercent,
      width: targetW,
      height: targetH,
      format: optimizedFile.type || targetFormat
    };
  } catch (err) {
    console.warn('[Image Optimizer] Fallback to original file:', err);
    return {
      file,
      originalBytes,
      compressedBytes: file.size,
      savedPercent: 0,
      width: 0,
      height: 0,
      format: file.type
    };
  }
}

export async function optimizeImageForUpload(
  file: File,
  options: OptimizeOptions = {}
): Promise<File> {
  const res = await optimizeImageWithStats(file, options);
  return res.file;
}
