// ─── Media Compression Utilities ─────────────────────────────────────────────
// Compresses images and videos client-side before upload

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const IMAGE_MAX_WIDTH   = 1080;
const IMAGE_MAX_HEIGHT  = 1350; // 4:5 portrait max
const IMAGE_QUALITY     = 0.82;
const VIDEO_MAX_SIZE_MB = 100; // Sıkıştırma yapacağımız için limiti biraz artırabiliriz


// ─── IMAGE COMPRESSION ────────────────────────────────────────────────────────
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Not an image file'));
    }

    const img     = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      let { width, height } = img;

      // Scale down maintaining aspect ratio
      if (width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT) {
        const wRatio = IMAGE_MAX_WIDTH  / width;
        const hRatio = IMAGE_MAX_HEIGHT / height;
        const ratio  = Math.min(wRatio, hRatio);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas  = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Fill with black for transparent PNGs
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const outMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas blob failed'));
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
            type: outMime,
            lastModified: Date.now(),
          });

          resolve({
            file:       compressedFile,
            url:        URL.createObjectURL(compressedFile),
            width,
            height,
            origSizeKB: Math.round(file.size / 1024),
            newSizeKB:  Math.round(blob.size / 1024),
            type:       'image',
          });
        },
        outMime,
        IMAGE_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Image load failed'));
    };

    img.src = blobUrl;
  });
}

// ─── VIDEO COMPRESSION / VALIDATION ──────────────────────────────────────────
// Note: True client-side video compression requires FFmpeg.wasm which is heavy.
// We do validation + thumbnail extraction here, and rely on Firebase storage rules.
export async function processVideo(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('video/')) {
      return reject(new Error('Not a video file'));
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > VIDEO_MAX_SIZE_MB) {
      return reject(new Error(`Video too large (max ${VIDEO_MAX_SIZE_MB}MB, got ${sizeMB.toFixed(1)}MB)`));
    }

    const video  = document.createElement('video');
    const blobUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const { duration, videoWidth: width, videoHeight: height } = video;

      if (duration > 90) {
        URL.revokeObjectURL(blobUrl);
        return reject(new Error('Video too long (max 90 seconds)'));
      }

      // Extract thumbnail at 0.5s
      video.currentTime = Math.min(0.5, duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const w      = Math.min(video.videoWidth,  720);
      const h      = Math.round(video.videoHeight * (w / video.videoWidth));
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);

      canvas.toBlob(
        (thumbBlob) => {
          URL.revokeObjectURL(blobUrl);
          const thumbnailUrl = thumbBlob ? URL.createObjectURL(thumbBlob) : null;

          resolve({
            file,
            url:          URL.createObjectURL(file),
            thumbnailUrl,
            width:        video.videoWidth,
            height:       video.videoHeight,
            duration:     Math.round(video.duration),
            origSizeKB:   Math.round(file.size / 1024),
            newSizeKB:    Math.round(file.size / 1024), // no compression, same size
            type:         'video',
          });
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Video load failed'));
    };

    video.src    = blobUrl;
    video.muted  = true;
    video.preload = 'metadata';
  });
}

// ─── FFmpeg VIDEO COMPRESSION ────────────────────────────────────────────────
let ffmpegInstance = null;

export async function compressVideo(file, onProgress) {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }
  
  const ffmpeg = ffmpegInstance;

  // Sadece ilk seferde yüklenir
  if (!ffmpeg.loaded) {
    if (onProgress) onProgress({ message: 'Sıkıştırma motoru yükleniyor...', ratio: 0 });
    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
    });
  }

  ffmpeg.on('progress', ({ progress, time }) => {
    if (onProgress) onProgress({ message: 'Video sıkıştırılıyor...', ratio: progress });
  });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const inputName = `input.${ext}`;
  const outputName = 'output.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // FFmpeg komutu: 720p'ye orantılı scale, h264, ultrafast preset
  // crf 28 ile kalite/boyut dengesi sağlanır.
  await ffmpeg.exec([
    '-i', inputName,
    '-vf', 'scale=-2:720',
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'ultrafast',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  
  // Cleanup bellek
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
  const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '') + '.mp4', {
    type: 'video/mp4',
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    url: URL.createObjectURL(compressedFile),
    type: 'video'
  };
}

// ─── PROFILE PHOTO COMPRESSION ───────────────────────────────────────────────
export async function compressProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    const img     = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      const size = 400; // Profile photos: 400x400
      const canvas = document.createElement('canvas');
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Center-crop to square
      const min  = Math.min(img.width, img.height);
      const sx   = (img.width  - min) / 2;
      const sy   = (img.height - min) / 2;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas blob failed'));
          const compressedFile = new File([blob], 'avatar.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve({
            file: compressedFile,
            url:  URL.createObjectURL(compressedFile),
            size: blob.size,
          });
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Load failed')); };
    img.src = blobUrl;
  });
}

// ─── ACCEPT TYPES ─────────────────────────────────────────────────────────────
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic';
export const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-msvideo';
export const MEDIA_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;
