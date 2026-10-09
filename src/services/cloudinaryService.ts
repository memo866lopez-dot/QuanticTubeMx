/**
 * Cloudinary Cloud Video Storage Service
 * Handles direct browser-to-cloud video uploads using Unsigned Upload Presets
 * Generates permanent globally-accessible HTTPS video URLs across all devices
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

const STORAGE_KEY = 'quantictube_cloudinary_config';

export const DEFAULT_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'QuanticTube',
  uploadPreset: 'ml_default'
};

export function getCloudinaryConfig(): CloudinaryConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.cloudName && parsed.uploadPreset) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CLOUDINARY_CONFIG;
}

export function saveCloudinaryConfig(config: CloudinaryConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export interface CloudinaryUploadResult {
  success: boolean;
  url: string;
  publicId?: string;
  duration?: number;
  format?: string;
  error?: string;
  isSignedPresetError?: boolean;
}

/**
 * Upload a video file directly to Cloudinary with real-time percentage progress
 */
export function uploadVideoToCloudinary(
  fileOrBlob: File | Blob,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve) => {
    const config = getCloudinaryConfig();
    const cloudName = config.cloudName.trim();
    const uploadPreset = config.uploadPreset.trim();

    // If Cloudinary is using placeholder credentials, do not make an invalid request
    if (!cloudName || cloudName === 'QuanticTube' || !uploadPreset || uploadPreset === 'ml_default') {
      resolve({
        success: false,
        url: '',
        error: 'Cloudinary no configurado con credenciales de usuario.',
        isSignedPresetError: false
      });
      return;
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    const formData = new FormData();
    formData.append('file', fileOrBlob);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', 'video');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && (data.secure_url || data.url)) {
          if (onProgress) onProgress(100);
          resolve({
            success: true,
            url: data.secure_url || data.url,
            publicId: data.public_id,
            duration: data.duration,
            format: data.format
          });
          return;
        }

        const errMsg = data.error?.message || `HTTP ${xhr.status}`;

        const isSignedError =
          errMsg.toLowerCase().includes('unknown api key') ||
          errMsg.toLowerCase().includes('upload preset must be specified when using unsigned') ||
          errMsg.toLowerCase().includes('unsigned');

        resolve({
          success: false,
          url: '',
          error: errMsg,
          isSignedPresetError: isSignedError
        });
      } catch (err: any) {
        resolve({
          success: false,
          url: '',
          error: err.message || 'Error parsing Cloudinary response'
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        url: '',
        error: 'Network error connecting to Cloudinary API. Verifica tu conexión.'
      });
    };

    xhr.send(formData);
  });
}

/**
 * Upload an image file (thumbnail or photo) directly to Cloudinary
 */
export function uploadImageToCloudinary(
  fileOrBlob: File | Blob,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve) => {
    const config = getCloudinaryConfig();
    const cloudName = config.cloudName.trim();
    const uploadPreset = config.uploadPreset.trim();

    // If Cloudinary is using placeholder credentials, do not make an invalid request
    if (!cloudName || cloudName === 'QuanticTube' || !uploadPreset || uploadPreset === 'ml_default') {
      resolve({
        success: false,
        url: '',
        error: 'Cloudinary no configurado con credenciales de usuario.',
        isSignedPresetError: false
      });
      return;
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const formData = new FormData();
    formData.append('file', fileOrBlob);
    formData.append('upload_preset', uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && (data.secure_url || data.url)) {
          if (onProgress) onProgress(100);
          resolve({
            success: true,
            url: data.secure_url || data.url,
            publicId: data.public_id,
            format: data.format
          });
          return;
        }

        const errMsg = data.error?.message || `HTTP ${xhr.status}`;

        resolve({
          success: false,
          url: '',
          error: errMsg
        });
      } catch (err: any) {
        resolve({
          success: false,
          url: '',
          error: err.message || 'Error parsing Cloudinary response'
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        url: '',
        error: 'Network error connecting to Cloudinary API'
      });
    };

    xhr.send(formData);
  });
}

/**
 * Converts a Cloudinary video URL to an auto-generated thumbnail JPG
 */
export function getCloudinaryVideoThumbnail(videoUrl: string): string {
  if (!videoUrl || !videoUrl.includes('cloudinary.com')) return '';
  return videoUrl.replace(/\.(mp4|webm|mov|mkv|avi|ogv)$/i, '.jpg');
}
