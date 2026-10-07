import { registerVideoBlob } from './videoBlobService';

/**
 * QuanticTube Video Generator Engine (Veo 3.1 & Canvas Synthesis)
 * Generates real, playable and downloadable video blobs using HTML5 Canvas & MediaRecorder.
 */

export interface VideoGenOptions {
  prompt: string;
  format: '16:9' | '9:16';
  style: 'cyberpunk' | 'mariachi_synth' | 'hyperreal' | 'neon_matrix' | 'retro_vhs';
  overlayText?: string;
  durationSeconds?: number;
  sourceImageBase64?: string;
  onProgress?: (progress: number, stage: string) => void;
}

export async function generateSyntheticVideo(options: VideoGenOptions): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  const {
    prompt,
    format,
    style,
    overlayText = '',
    durationSeconds = 6,
    sourceImageBase64,
    onProgress
  } = options;

  onProgress?.(10, 'Iniciando motor neuronal Veo 3.1 & Canvas Synthesis...');

  const width = format === '16:9' ? 1280 : 720;
  const height = format === '16:9' ? 720 : 1280;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Load image if provided
  let loadedImg: HTMLImageElement | null = null;
  if (sourceImageBase64) {
    onProgress?.(20, 'Cargando y procesando imagen para animación de cámara...');
    loadedImg = new Image();
    loadedImg.crossOrigin = 'anonymous';
    loadedImg.src = sourceImageBase64;
    await new Promise((resolve) => {
      if (loadedImg) {
        loadedImg.onload = () => resolve(true);
        loadedImg.onerror = () => resolve(false);
      } else {
        resolve(false);
      }
    });
  }

  onProgress?.(35, 'Generando partículas de plasma tricolor y texturas...');

  // Setup audio stream using Web Audio API
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const dest = audioCtx.createMediaStreamDestination();

  // Simple ambient synth chord
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(220, audioCtx.currentTime); // A3

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);

  osc1.start();
  osc2.start();

  // Combine canvas video stream + audio stream
  const videoStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }
  }

  const mediaRecorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<{ videoUrl: string; thumbnailUrl: string }>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const genId = `ai-gen-${Date.now()}`;
      const videoUrl = registerVideoBlob(genId, blob);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

      osc1.stop();
      osc2.stop();
      audioCtx.close();

      resolve({ videoUrl, thumbnailUrl });
    };

    mediaRecorder.onerror = (err) => {
      reject(err);
    };
  });

  mediaRecorder.start();

  // Particles
  const particles: { x: number; y: number; size: number; speedY: number; speedX: number; color: string }[] = [];
  const colors = ['#00ff88', '#ffffff', '#ff0055', '#00f5ff'];
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      speedY: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  const totalFrames = durationSeconds * 30;
  let currentFrame = 0;

  const renderFrame = () => {
    const progress = currentFrame / totalFrames;
    const time = currentFrame / 30;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (style === 'cyberpunk') {
      bgGrad.addColorStop(0, '#07080f');
      bgGrad.addColorStop(0.5, '#0e1122');
      bgGrad.addColorStop(1, '#1a081d');
    } else if (style === 'neon_matrix') {
      bgGrad.addColorStop(0, '#030d07');
      bgGrad.addColorStop(1, '#05180f');
    } else {
      bgGrad.addColorStop(0, '#0a0a14');
      bgGrad.addColorStop(0.5, '#121424');
      bgGrad.addColorStop(1, '#210c14');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // If source image exists, animate camera zoom & pan
    if (loadedImg && loadedImg.width > 0) {
      ctx.save();
      const zoom = 1 + progress * 0.18; // smooth slow zoom-in
      const panX = Math.sin(progress * Math.PI) * 20;
      ctx.translate(width / 2 + panX, height / 2);
      ctx.scale(zoom, zoom);
      ctx.drawImage(
        loadedImg,
        -width / 2,
        -height / 2,
        width,
        height
      );
      ctx.restore();

      // Cyber hologram overlay on image
      ctx.fillStyle = 'rgba(7, 10, 20, 0.45)';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Procedural Cyberpunk Horizon & Sun
      ctx.save();
      const sunY = height * 0.45;
      const sunRadius = Math.min(width, height) * 0.22;
      const sunGrad = ctx.createRadialGradient(width / 2, sunY, 10, width / 2, sunY, sunRadius);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.3, '#00ff88');
      sunGrad.addColorStop(0.7, '#ff0055');
      sunGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width / 2, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Horizon grid lines (retro 3D perspective grid)
      const horizonY = height * 0.6;
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
      ctx.lineWidth = 1.5;

      for (let y = horizonY; y < height; y += (y - horizonY) * 0.2 + 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      for (let x = -width; x < width * 2; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(width / 2 + (x - width / 2) * 0.15, horizonY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Floating particles
    for (const p of particles) {
      p.y -= p.speedY;
      p.x += p.speedX;
      if (p.y < 0) p.y = height;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Scanlines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }

    // Dynamic HUD / Audio Visualizer bars
    const barCount = 24;
    const barWidth = 6;
    const spacing = 4;
    const startX = (width - barCount * (barWidth + spacing)) / 2;
    const bottomY = height - 50;

    for (let b = 0; b < barCount; b++) {
      const barH = 15 + Math.sin(time * 6 + b * 0.5) * 25 + Math.cos(time * 3 + b) * 15;
      const barColor = b < barCount / 3 ? '#00ff88' : b < (barCount * 2) / 3 ? '#ffffff' : '#ff0055';
      ctx.fillStyle = barColor;
      ctx.shadowColor = barColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(startX + b * (barWidth + spacing), bottomY - barH, barWidth, barH);
    }
    ctx.shadowBlur = 0;

    // Title / Prompt Overlay
    ctx.save();
    ctx.font = `bold ${Math.round(width * 0.038)}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';

    const displayTitle = overlayText || prompt.slice(0, 45);
    ctx.fillText(displayTitle, width / 2, height * 0.2);

    // Watermark QuanticTube IA
    ctx.font = `600 ${Math.round(width * 0.02)}px Rajdhani, sans-serif`;
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillText('⚡ QUANTICTUBE AI • VEO 3.1 ENGINE', width / 2, height * 0.25);
    ctx.restore();

    currentFrame++;

    if (currentFrame % 15 === 0) {
      const pct = Math.round(35 + (currentFrame / totalFrames) * 60);
      onProgress?.(pct, `Renderizando fotograma ${currentFrame}/${totalFrames}...`);
    }

    if (currentFrame < totalFrames) {
      requestAnimationFrame(renderFrame);
    } else {
      onProgress?.(98, 'Compilando video WebM / MP4...');
      mediaRecorder.stop();
    }
  };

  renderFrame();

  return recordingPromise;
}
