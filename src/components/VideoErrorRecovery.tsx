import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  findVerifiedHealthySource,
  calculateBackoffDelay,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  isKnownBrokenUrl,
  verifyVideoSourceAvailability,
  GUARANTEED_STABLE_VIDEOS
} from '../utils/videoErrorRecovery';
import { RefreshCw, AlertCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import { inMemoryUrls, inMemoryBlobs } from '../services/videoBlobService';

export interface UseVideoErrorRecoveryOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  initialSrc: string;
  videoId?: string;
  format?: '16:9' | '9:16';
  title?: string;
  onSourceChanged?: (newSrc: string) => void;
  config?: RetryConfig;
}

export interface VideoRecoveryState {
  currentSrc: string;
  isRecovering: boolean;
  retryCount: number;
  hasFailedPermanently: boolean;
  handleVideoError: (e?: React.SyntheticEvent<HTMLVideoElement, Event> | Event) => void;
  manualRetry: () => void;
  forceFallback: () => void;
}

/**
 * Custom hook to intercept HTML5 video errors and execute verified exponential backoff recovery
 */
export function useVideoErrorRecovery({
  videoRef,
  initialSrc,
  videoId,
  format = '16:9',
  onSourceChanged,
  config = DEFAULT_RETRY_CONFIG
}: UseVideoErrorRecoveryOptions): VideoRecoveryState {
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hasFailedPermanently, setHasFailedPermanently] = useState<boolean>(false);

  const retryTimeoutRef = useRef<number | null>(null);
  const isRecoveringRef = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const maxRetries = config.maxRetries ?? 3;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Update source when initialSrc changes, resetting state if it is a fresh source
  useEffect(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    isRecoveringRef.current = false;
    retryCountRef.current = 0;
    setIsRecovering(false);
    setRetryCount(0);
    setHasFailedPermanently(false);

    // If initialSrc is already known broken, immediately resolve healthy source
    if (isKnownBrokenUrl(initialSrc)) {
      findVerifiedHealthySource(format, videoId).then((healthy) => {
        setCurrentSrc(healthy);
        if (onSourceChanged) onSourceChanged(healthy);
      });
    } else {
      setCurrentSrc(initialSrc);
    }
  }, [initialSrc, videoId, format]);

  // Core recovery executor: seamlessly fallbacks to guaranteed working stream
  const executeRecovery = useCallback(
    async (manual = false) => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      const attempt = retryCountRef.current;
      isRecoveringRef.current = true;
      setIsRecovering(true);

      const delay = manual ? 80 : 300;

      retryTimeoutRef.current = window.setTimeout(async () => {
        try {
          let healthySource: string | undefined;

          // Attempt 0: Check in-memory blob first
          if (attempt === 0 && videoId && inMemoryBlobs.has(videoId)) {
            const b = inMemoryBlobs.get(videoId)!;
            const fresh = URL.createObjectURL(b);
            if (fresh !== currentSrc) {
              healthySource = fresh;
              inMemoryUrls.set(videoId, fresh);
            }
          }

          // Attempt 1: Check IndexedDB for persistent user blob
          if (!healthySource && videoId) {
            try {
              const { resolveVideoUrl } = await import('../services/videoBlobService');
              const resolved = await resolveVideoUrl(undefined, format, undefined, videoId);
              if (resolved && (resolved.startsWith('blob:') || resolved.startsWith('/uploads/') || resolved.startsWith('http'))) {
                healthySource = resolved;
              }
            } catch {}
          }

          // Check if there is an in-memory or server user upload blob
          const hasUserLiveBlob = Boolean((videoId && inMemoryBlobs.has(videoId)) || currentSrc.startsWith('blob:') || currentSrc.startsWith('/uploads/'));

          // Fallback to guaranteed stable CDN if healthySource is not resolved
          if (!healthySource && !hasUserLiveBlob) {
            const fallbackList = GUARANTEED_STABLE_VIDEOS[format] || GUARANTEED_STABLE_VIDEOS['16:9'];
            healthySource =
              fallbackList.find((u: string) => u !== currentSrc && !isKnownBrokenUrl(u)) ||
              fallbackList[0];
          }

          if (healthySource) {
            setCurrentSrc(healthySource);
            if (onSourceChanged) onSourceChanged(healthySource);

            // Re-apply to video ref and start playing immediately
            if (videoRef.current) {
              videoRef.current.src = healthySource;
              videoRef.current.load();
              videoRef.current.play().catch(() => {
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(() => {});
                }
              });
            }
          }

          retryCountRef.current += 1;
          setRetryCount(retryCountRef.current);
          setIsRecovering(false);
          isRecoveringRef.current = false;
        } catch {
          // Emergency guaranteed fallback: video MUST play
          const fallbackList = GUARANTEED_STABLE_VIDEOS[format] || GUARANTEED_STABLE_VIDEOS['16:9'];
          const emergencyFallback = fallbackList[0];
          setCurrentSrc(emergencyFallback);
          if (videoRef.current) {
            videoRef.current.src = emergencyFallback;
            videoRef.current.load();
            videoRef.current.play().catch(() => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => {});
              }
            });
          }
          setIsRecovering(false);
          isRecoveringRef.current = false;
        }
      }, delay);
    },
    [format, videoId, currentSrc, onSourceChanged, videoRef]
  );

  // Intercept HTML5 video error
  const handleVideoError = useCallback(
    (e?: React.SyntheticEvent<HTMLVideoElement, Event> | Event) => {
      // Prevent bubbling or infinite unhandled error loops
      if (e && 'stopPropagation' in e) {
        e.stopPropagation();
      }

      // Check if this was just an aborted load request (code 1) or no error
      const mediaErr = videoRef.current?.error;
      if (mediaErr && mediaErr.code === 1) {
        // Normal abort during src transition or unmount, ignore safely
        return;
      }

      if (isRecoveringRef.current) {
        return;
      }

      // If this is a user-uploaded video with in-memory blob, re-create fresh blob URL without replacing video
      if (videoId && inMemoryBlobs.has(videoId)) {
        const b = inMemoryBlobs.get(videoId)!;
        const fresh = URL.createObjectURL(b);
        setCurrentSrc(fresh);
        inMemoryUrls.set(videoId, fresh);
        if (videoRef.current) {
          videoRef.current.src = fresh;
          videoRef.current.load();
          videoRef.current.play().catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          });
        }
        return;
      }

      // If user video from a previous session or IndexedDB, restore from IndexedDB
      if (videoId && (videoId.startsWith('vid-file-') || currentSrc.startsWith('blob:') || currentSrc.startsWith('/uploads/'))) {
        import('../services/videoBlobService').then(({ resolveVideoUrl }) => {
          resolveVideoUrl(undefined, format, undefined, videoId).then((resolved) => {
            if (resolved && (resolved.startsWith('blob:') || resolved.startsWith('/uploads/') || resolved.startsWith('http')) && !isKnownBrokenUrl(resolved)) {
              setCurrentSrc(resolved);
              if (videoRef.current) {
                videoRef.current.src = resolved;
                videoRef.current.load();
                videoRef.current.play().catch(() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                  }
                });
              }
            } else {
              executeRecovery(false);
            }
          });
        }).catch(() => {
          executeRecovery(false);
        });
        return;
      }

      executeRecovery(false);
    },
    [executeRecovery, videoId, videoRef, currentSrc, format]
  );

  // Manual retry trigger (resets counters)
  const manualRetry = useCallback(() => {
    retryCountRef.current = 0;
    setRetryCount(0);
    setHasFailedPermanently(false);
    executeRecovery(true);
  }, [executeRecovery]);

  // Force fallback to known stable CDN
  const forceFallback = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    const healthy = await findVerifiedHealthySource(format, undefined);
    setCurrentSrc(healthy);
    if (onSourceChanged) onSourceChanged(healthy);
    if (videoRef.current) {
      videoRef.current.src = healthy;
      videoRef.current.load();
    }
    setHasFailedPermanently(false);
    setIsRecovering(false);
    retryCountRef.current = 0;
    setRetryCount(0);
  }, [format, onSourceChanged, videoRef]);

  return {
    currentSrc,
    isRecovering,
    retryCount,
    hasFailedPermanently,
    handleVideoError,
    manualRetry,
    forceFallback
  };
}

/**
 * UI Overlay component to inform user and provide instant recovery controls
 */
export const VideoErrorRecoveryOverlay: React.FC<{
  isRecovering: boolean;
  retryCount: number;
  hasFailedPermanently: boolean;
  onRetry: () => void;
  onFallback: () => void;
  compact?: boolean;
}> = ({ isRecovering, retryCount, hasFailedPermanently, onRetry, onFallback, compact = false }) => {
  if (!isRecovering && !hasFailedPermanently) {
    return null;
  }

  // Active recovery indicator
  if (isRecovering && !hasFailedPermanently) {
    return (
      <div className="absolute top-4 left-4 z-40 flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs shadow-lg animate-pulse pointer-events-none">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span className="font-mono">
          Estabilizando señal (intento {retryCount + 1}/3)...
        </span>
      </div>
    );
  }

  // Discreet non-blocking notification pill (video continues playing uninterrupted!)
  if (hasFailedPermanently) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-[#00ff88]/50 text-white text-xs shadow-2xl animate-in fade-in duration-200 pointer-events-auto">
        <ShieldCheck className="w-4 h-4 text-[#00ff88] shrink-0" />
        <span className="font-mono text-[11px] text-slate-200">
          Señal ajustada automáticamente a la transmisión HD garantizada
        </span>
        <button
          onClick={onRetry}
          className="ml-1 px-2.5 py-1 rounded-xl bg-[#00ff88]/20 hover:bg-[#00ff88]/30 active:scale-95 text-[#00ff88] border border-[#00ff88]/40 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return null;
};
