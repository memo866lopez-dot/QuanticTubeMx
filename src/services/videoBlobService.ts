// Service for managing persistent local video/media blobs in IndexedDB and memory

const DB_NAME = 'quantictube_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

export const inMemoryBlobs = new Map<string, Blob>();
export const inMemoryUrls = new Map<string, string>();

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not available'));
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Hydrate stored blobs from IndexedDB into memory on startup
if (typeof window !== 'undefined' && window.indexedDB) {
  getDB()
    .then((db) => {
      if (!db.objectStoreNames.contains(STORE_NAME)) return;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const id = String(cursor.key);
          const blob = cursor.value as Blob;
          if (blob instanceof Blob) {
            inMemoryBlobs.set(id, blob);
            const liveUrl = URL.createObjectURL(blob);
            inMemoryUrls.set(id, liveUrl);
          }
          cursor.continue();
        }
      };
    })
    .catch((err) => {
      console.warn('Could not pre-warm video blobs from IndexedDB:', err);
    });
}

export const FALLBACK_VIDEOS = {
  '16:9': [
    'https://vjs.zencdn.net/v/oceans.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4'
  ],
  '9:16': [
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  ]
};

/**
 * Asynchronously upload video to local server disk for permanent storage across sessions
 */
export function uploadVideoToServer(id: string, fileOrBlob: Blob | File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const filename = (fileOrBlob as File).name || 'video.mp4';
        const res = await fetch('/api/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, base64Data: base64, filename })
        });
        if (!res.ok) {
          resolve(null);
          return;
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          resolve(null);
          return;
        }
        const data = await res.json();
        if (data.success && data.url) {
          inMemoryUrls.set(id, data.url);
          // Persist permanent /uploads/ URL to localStorage
          try {
            const keys = ['quantictube_videos_v7', 'quantictube_videos_v6'];
            keys.forEach((storageKey) => {
              const raw = localStorage.getItem(storageKey);
              if (raw) {
                const videos = JSON.parse(raw);
                if (Array.isArray(videos)) {
                  const updated = videos.map((v: any) => v.id === id ? { ...v, videoUrl: data.url } : v);
                  localStorage.setItem(storageKey, JSON.stringify(updated));
                }
              }
            });
          } catch {}

          // Notify runtime listeners
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('quantictube_video_url_updated', { detail: { id, url: data.url } }));
          }

          // Also persist permanent URL to Firestore if doc exists
          try {
            const { db } = await import('../firebase');
            const { doc, updateDoc } = await import('firebase/firestore');
            const videoRef = doc(db, 'videos', id);
            await updateDoc(videoRef, { videoUrl: data.url });
          } catch {}
          resolve(data.url);
          return;
        }
      } catch (_err) {
        // Keeping local IndexedDB blob without console noise
      }
      resolve(null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Register a video File or Blob, store in memory and IndexedDB, and return a usable object URL
 */
export function registerVideoBlob(idOrKey: string, blob: Blob | File): string {
  inMemoryBlobs.set(idOrKey, blob);
  
  // Revoke old URL for same key if exists
  const oldUrl = inMemoryUrls.get(idOrKey);
  if (oldUrl && oldUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(oldUrl);
    } catch {}
  }

  const newUrl = URL.createObjectURL(blob);
  inMemoryUrls.set(idOrKey, newUrl);
  inMemoryUrls.set(newUrl, newUrl);

  // Upload to server disk asynchronously so it persists forever
  uploadVideoToServer(idOrKey, blob).catch(() => {});

  // Persist asynchronously in IndexedDB
  getDB()
    .then((db) => {
      if (!db.objectStoreNames.contains(STORE_NAME)) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, idOrKey);
    })
    .catch((err) => {
      console.warn('Could not persist video blob to IndexedDB:', err);
    });

  return newUrl;
}

/**
 * Delete a stored video blob from memory and IndexedDB
 */
export function deleteVideoBlob(id: string): void {
  const url = inMemoryUrls.get(id);
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
  inMemoryUrls.delete(id);
  inMemoryBlobs.delete(id);

  getDB()
    .then((db) => {
      if (!db.objectStoreNames.contains(STORE_NAME)) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
    })
    .catch(() => {});
}

/**
 * Get next alternative fallback URL
 */
export async function getNextFallbackVideo(
  idOrKey: string,
  currentUrl: string,
  format: '16:9' | '9:16' = '16:9',
  title?: string
): Promise<string> {
  if (inMemoryUrls.has(idOrKey)) {
    return inMemoryUrls.get(idOrKey)!;
  }

  const list = FALLBACK_VIDEOS[format] || FALLBACK_VIDEOS['16:9'];
  const currentIndex = list.indexOf(currentUrl);
  if (currentIndex >= 0 && currentIndex < list.length - 1) {
    return list[currentIndex + 1];
  }
  return list[0];
}

/**
 * Resolve a video URL: If it is a dead/revoked blob URL or empty, resolve from memory/IndexedDB
 */
export async function resolveVideoUrl(
  urlOrId: string | undefined,
  format: '16:9' | '9:16' = '16:9',
  title?: string,
  id?: string
): Promise<string> {
  const targetId = id || (urlOrId && !urlOrId.startsWith('http') && !urlOrId.startsWith('blob:') && !urlOrId.startsWith('data:') ? urlOrId : undefined);

  if (targetId) {
    if (inMemoryUrls.has(targetId)) {
      return inMemoryUrls.get(targetId)!;
    }
    if (inMemoryBlobs.has(targetId)) {
      const blob = inMemoryBlobs.get(targetId)!;
      const liveUrl = URL.createObjectURL(blob);
      inMemoryUrls.set(targetId, liveUrl);
      return liveUrl;
    }
    try {
      const db = await getDB();
      if (!db.objectStoreNames.contains(STORE_NAME)) return targetId;
      const blob = await new Promise<Blob | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(targetId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (blob && blob instanceof Blob) {
        inMemoryBlobs.set(targetId, blob);
        const liveUrl = URL.createObjectURL(blob);
        inMemoryUrls.set(targetId, liveUrl);
        return liveUrl;
      }
    } catch (err) {
      console.warn('Error reading from IndexedDB video cache:', err);
    }
  }

  if (
    !urlOrId ||
    !urlOrId.trim() ||
    urlOrId.includes('commondatastorage.googleapis.com') ||
    urlOrId.includes('w3schools.com') ||
    urlOrId.includes('media.w3.org') ||
    urlOrId.includes('w3.org')
  ) {
    return FALLBACK_VIDEOS[format][0];
  }

  // If it's in active memory URL map
  if (inMemoryUrls.has(urlOrId)) {
    return inMemoryUrls.get(urlOrId)!;
  }

  // If it's in active memory blobs
  if (inMemoryBlobs.has(urlOrId)) {
    const blob = inMemoryBlobs.get(urlOrId)!;
    const liveUrl = URL.createObjectURL(blob);
    inMemoryUrls.set(urlOrId, liveUrl);
    return liveUrl;
  }

  // If it's a valid Data URL, return it
  if (urlOrId.startsWith('data:')) {
    return urlOrId;
  }

  // If it's a live in-memory blob URL, return it
  if (urlOrId.startsWith('blob:') && (inMemoryUrls.has(urlOrId) || inMemoryBlobs.has(urlOrId))) {
    return urlOrId;
  }

  // Try retrieving from IndexedDB using urlOrId or targetId as key
  try {
    const db = await getDB();
    if (db.objectStoreNames.contains(STORE_NAME)) {
      const lookupKey = targetId || urlOrId;
      const blob = await new Promise<Blob | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(lookupKey);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (blob && blob instanceof Blob) {
        if (targetId) inMemoryBlobs.set(targetId, blob);
        inMemoryBlobs.set(urlOrId, blob);
        const liveUrl = URL.createObjectURL(blob);
        if (targetId) inMemoryUrls.set(targetId, liveUrl);
        inMemoryUrls.set(urlOrId, liveUrl);
        return liveUrl;
      }
    }
  } catch (err) {
    console.warn('Error reading from IndexedDB video cache:', err);
  }

  // If it's an HTTP/HTTPS or relative URL (/uploads/...), return it directly
  if (urlOrId.startsWith('http://') || urlOrId.startsWith('https://') || urlOrId.startsWith('/uploads/')) {
    return urlOrId;
  }

  return urlOrId || FALLBACK_VIDEOS[format][0];
}

/**
 * Synchronously checks if URL is likely valid or returns instant fallback
 */
export function getSafeVideoUrl(
  url: string | undefined,
  format: '16:9' | '9:16' = '16:9',
  id?: string
): string {
  if (id && inMemoryUrls.has(id)) {
    return inMemoryUrls.get(id)!;
  }
  if (id && inMemoryBlobs.has(id)) {
    const b = inMemoryBlobs.get(id)!;
    const freshUrl = URL.createObjectURL(b);
    inMemoryUrls.set(id, freshUrl);
    return freshUrl;
  }
  if (url && inMemoryUrls.has(url)) {
    return inMemoryUrls.get(url)!;
  }
  if (url && inMemoryBlobs.has(url)) {
    const b = inMemoryBlobs.get(url)!;
    const freshUrl = URL.createObjectURL(b);
    inMemoryUrls.set(url, freshUrl);
    return freshUrl;
  }
  if (
    !url ||
    typeof url !== 'string' ||
    !url.trim() ||
    url.includes('commondatastorage.googleapis.com') ||
    url.includes('w3schools.com') ||
    url.includes('media.w3.org') ||
    url.includes('w3.org')
  ) {
    return format === '9:16' ? FALLBACK_VIDEOS['9:16'][0] : FALLBACK_VIDEOS['16:9'][0];
  }
  if (url.startsWith('blob:')) {
    // If it's a blob URL, preserve it! Also register it so inMemoryUrls knows it
    if (id && !inMemoryUrls.has(id)) {
      inMemoryUrls.set(id, url);
    }
    inMemoryUrls.set(url, url);
    return url;
  }
  if (url.startsWith('/uploads/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return url || (format === '9:16' ? FALLBACK_VIDEOS['9:16'][0] : FALLBACK_VIDEOS['16:9'][0]);
}
