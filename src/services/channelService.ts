import { ChannelCustomization, ChannelLedColor } from '../types';

export const MOVING_BANNER_PRESETS: {
  id: string;
  name: string;
  type: 'video' | 'gif';
  url: string;
  previewImage: string;
}[] = [
  {
    id: 'matrix-grid-cyber-gif',
    name: 'Rejilla Cuántica Neón (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'cyberpunk-city-rain-gif',
    name: 'Ciudad Neotitlán 2026 (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'holographic-code-stream-gif',
    name: 'Flujo Holográfico Matrix (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'synthwave-tunnel-laser-gif',
    name: 'Túnel Láser Synthwave (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'neural-quantum-circuits-gif',
    name: 'Circuito Neuronal Cuántico (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'quantum-waves-particles-gif',
    name: 'Ondas y Partículas Cuánticas (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'retro-cyber-horizon-gif',
    name: 'Horizonte Neón Cyberpunk (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/26BRzozg4TCBXv6QU/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'hyperspace-vortex-gif',
    name: 'Vórtice Galáctico Cuántico (Loop 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
    previewImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ocean-quantum-video-loop',
    name: 'Océano Cuántico Cósmico (Video 4K Loop)',
    type: 'video',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    previewImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'fluorescent-plasma-video-loop',
    name: 'Plasma Fluorescente Cuántico (Video Loop)',
    type: 'video',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    previewImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
  }
];

export function isMediaVideo(url?: string, explicitType?: string): boolean {
  if (!url) return false;
  if (explicitType === 'video') return true;
  if (explicitType === 'gif' || explicitType === 'image') return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('data:video/') ||
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.includes('video/mp4') ||
    clean.includes('video/webm')
  );
}

export const CHANNEL_LOGO_PRESETS: {
  id: string;
  name: string;
  type: 'image' | 'gif' | 'video';
  url: string;
}[] = [
  {
    id: 'logo-quantum-waves-gif',
    name: 'Orbe Cuántico (GIF 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif'
  },
  {
    id: 'logo-galaxy-vortex-gif',
    name: 'Vórtice Galáctico (GIF 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif'
  },
  {
    id: 'logo-neural-circuits-gif',
    name: 'Circuito Neón (GIF 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif'
  },
  {
    id: 'logo-matrix-flow-gif',
    name: 'Matrix Data Flow (GIF 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif'
  },
  {
    id: 'logo-plasma-flower-video',
    name: 'Plasma Fluorescente (Video MP4 Loop)',
    type: 'video',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  },
  {
    id: 'logo-cosmic-ocean-video',
    name: 'Océano Cósmico 4K (Video MP4 Loop)',
    type: 'video',
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  {
    id: 'logo-cyber-city-gif',
    name: 'Neotitlán Neón (GIF 60 FPS)',
    type: 'gif',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif'
  },
  {
    id: 'logo-cyber-eagle',
    name: 'Águila Cibernética Matrix (HD)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'logo-quantum-core',
    name: 'Núcleo Cuántico Neón (HD)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'logo-neon-helmet',
    name: 'Visor Synthwave Futurista (HD)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'logo-cyber-samurai',
    name: 'Samurái Cibernético (HD)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'logo-holographic-girl',
    name: 'Holograma Neón 2026 (HD)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  }
];

export const LED_COLOR_CONFIG: Record<
  ChannelLedColor,
  {
    name: string;
    hex: string;
    glowRgba: string;
    textShadow: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  'neon-green': {
    name: 'Verde Matrix Neón',
    hex: '#00ff88',
    glowRgba: 'rgba(0, 255, 136, 0.7)',
    textShadow: '0 0 7px #00ff88, 0 0 15px rgba(0, 255, 136, 0.8), 0 0 25px rgba(0, 255, 136, 0.4)',
    borderClass: 'border-[#00ff88]',
    bgClass: 'bg-[#00ff88]'
  },
  'cyber-pink': {
    name: 'Rosa Cyberpunk',
    hex: '#ff007f',
    glowRgba: 'rgba(255, 0, 127, 0.7)',
    textShadow: '0 0 7px #ff007f, 0 0 15px rgba(255, 0, 127, 0.8), 0 0 25px rgba(255, 0, 127, 0.4)',
    borderClass: 'border-[#ff007f]',
    bgClass: 'bg-[#ff007f]'
  },
  'quantum-blue': {
    name: 'Azul Cuántico',
    hex: '#00d4ff',
    glowRgba: 'rgba(0, 212, 255, 0.7)',
    textShadow: '0 0 7px #00d4ff, 0 0 15px rgba(0, 212, 255, 0.8), 0 0 25px rgba(0, 212, 255, 0.4)',
    borderClass: 'border-[#00d4ff]',
    bgClass: 'bg-[#00d4ff]'
  },
  'solar-gold': {
    name: 'Dorado Solar Holográfico',
    hex: '#ffb800',
    glowRgba: 'rgba(255, 184, 0, 0.7)',
    textShadow: '0 0 7px #ffb800, 0 0 15px rgba(255, 184, 0, 0.8), 0 0 25px rgba(255, 184, 0, 0.4)',
    borderClass: 'border-[#ffb800]',
    bgClass: 'bg-[#ffb800]'
  },
  'synth-purple': {
    name: 'Violeta Synthwave',
    hex: '#a855f7',
    glowRgba: 'rgba(168, 85, 247, 0.7)',
    textShadow: '0 0 7px #a855f7, 0 0 15px rgba(168, 85, 247, 0.8), 0 0 25px rgba(168, 85, 247, 0.4)',
    borderClass: 'border-[#a855f7]',
    bgClass: 'bg-[#a855f7]'
  },
  'laser-red': {
    name: 'Rojo Láser Neón',
    hex: '#ff2244',
    glowRgba: 'rgba(255, 34, 68, 0.7)',
    textShadow: '0 0 7px #ff2244, 0 0 15px rgba(255, 34, 68, 0.8), 0 0 25px rgba(255, 34, 68, 0.4)',
    borderClass: 'border-[#ff2244]',
    bgClass: 'bg-[#ff2244]'
  },
  'laser-white': {
    name: 'Blanco Ultra Láser',
    hex: '#ffffff',
    glowRgba: 'rgba(255, 255, 255, 0.8)',
    textShadow: '0 0 7px #ffffff, 0 0 15px rgba(255, 255, 255, 0.8), 0 0 25px rgba(0, 255, 136, 0.4)',
    borderClass: 'border-white',
    bgClass: 'bg-white'
  }
};

const CHANNELS_STORAGE_KEY = 'quantictube_channels_customization_v2';
const USER_ACTIVE_CHANNEL_KEY = 'quantictube_user_custom_channel_v2';

export const DEFAULT_CHANNELS: ChannelCustomization[] = [
  {
    id: 'ch-guillermo',
    name: 'Guillermo López • Quantic Studio',
    handle: '@guillermo_lopez',
    bio: 'Inventor, Escritor, Desarrollador, Innovador, Pintor, Escultor, Editor y Empresario Emprendedor. Creador y Fundador de QuanticTube empoderada con la mejor IA de Google.',
    avatar: 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif',
    avatarType: 'gif',
    verified: true,
    subscribers: '12.8M',
    subscribersCount: 12840200,
    bannerType: 'gif',
    bannerUrl: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
    ledColor: 'neon-green',
    ledAnimation: 'pulse',
    videoTitleAnimation: 'marquee',
    videoDescAnimation: 'ticker',
    accentTheme: 'emerald',
    links: [
      { title: 'QuanticTube Network', url: 'https://quantictube.ai' },
      { title: 'Omni-Live Streams', url: 'https://quantictube.ai/#live' }
    ],
    isOwner: false
  },
  {
    id: 'ch-quetzal',
    name: 'Dr. Quetzal Cyber Lab',
    handle: '@quetzal_ai',
    bio: 'Explorando Neotitlán 2026, Hyperloops cuánticos a 1,200 km/h y simulaciones de física con IA Veo 3.1.',
    avatar: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    avatarType: 'gif',
    verified: true,
    subscribers: '1.4M',
    subscribersCount: 1420100,
    bannerType: 'gif',
    bannerUrl: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    ledColor: 'quantum-blue',
    ledAnimation: 'wave',
    videoTitleAnimation: 'marquee',
    videoDescAnimation: 'ticker',
    accentTheme: 'cyan',
    links: [{ title: 'Neotitlan Hyperloop Docs', url: 'https://neotitlan.ai' }]
  },
  {
    id: 'ch-mariachi',
    name: 'Mariachi Synthwave Holográfico',
    handle: '@mariachi_synth',
    bio: 'Guitarras de plasma, trompetas sintetizadas y trajes con circuitos LED tricolor. Conciertos en vivo en el Zócalo Holográfico.',
    avatar: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
    avatarType: 'gif',
    verified: true,
    subscribers: '3.8M',
    subscribersCount: 3890450,
    bannerType: 'gif',
    bannerUrl: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
    ledColor: 'cyber-pink',
    ledAnimation: 'flash',
    videoTitleAnimation: 'neon-pulse',
    videoDescAnimation: 'ticker',
    accentTheme: 'magenta'
  },
  {
    id: 'ch-valeria',
    name: 'Valeria Neón • 3D Cyber Beats',
    handle: '@valeria_cyber',
    bio: 'Transmisiones en vivo Omni-Live, sintetizadores analógicos en 4K y arte cibernético futurista.',
    avatar: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    avatarType: 'gif',
    verified: true,
    subscribers: '42.8K',
    subscribersCount: 42800,
    bannerType: 'gif',
    bannerUrl: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    ledColor: 'synth-purple',
    ledAnimation: 'glow',
    videoTitleAnimation: 'marquee',
    videoDescAnimation: 'ticker',
    accentTheme: 'purple'
  },
  {
    id: 'ch-chef',
    name: 'Chef Cuántico Tenoch',
    handle: '@chef_tenoch',
    bio: 'Gastronomía molecular del futuro: Tacos al pastor con nitrógeno líquido y esferificaciones de salsa habanero.',
    avatar: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    avatarType: 'video',
    verified: true,
    subscribers: '2.1M',
    subscribersCount: 2100800,
    bannerType: 'gif',
    bannerUrl: 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif',
    ledColor: 'solar-gold',
    ledAnimation: 'pulse',
    videoTitleAnimation: 'marquee',
    videoDescAnimation: 'ticker',
    accentTheme: 'amber'
  }
];

export function loadChannels(): ChannelCustomization[] {
  try {
    const raw = localStorage.getItem(CHANNELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize broken legacy mixkit URLs
        let needsResave = false;
        parsed.forEach((c: ChannelCustomization) => {
          if (!c.bannerUrl || c.bannerUrl.includes('mixkit.co')) {
            c.bannerUrl = 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif';
            c.bannerType = 'gif';
            needsResave = true;
          }
        });
        // Merge with defaults if missing
        const handles = new Set(parsed.map((c: ChannelCustomization) => c.handle.toLowerCase()));
        const missing = DEFAULT_CHANNELS.filter((dc) => !handles.has(dc.handle.toLowerCase()));
        const result = [...parsed, ...missing];
        if (needsResave || missing.length > 0) {
          saveChannels(result);
        }
        return result;
      }
    }
  } catch (e) {
    console.warn('Error loading channels from localStorage:', e);
  }
  return DEFAULT_CHANNELS;
}

function sanitizeChannelsForStorage(channels: ChannelCustomization[]): ChannelCustomization[] {
  return channels.map((c) => {
    let bUrl = c.bannerUrl;
    let aUrl = c.avatar;
    // If a massive data URI is present, sanitize to prevent QuotaExceededError in localStorage
    if (bUrl && bUrl.startsWith('data:') && bUrl.length > 8000) {
      bUrl = 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif';
    }
    if (aUrl && aUrl.startsWith('data:') && aUrl.length > 8000) {
      aUrl = 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif';
    }
    return { ...c, bannerUrl: bUrl, avatar: aUrl };
  });
}

function cleanObsoleteStorageKeys(): void {
  const obsoleteKeys = [
    'quantictube_videos_v5',
    'quantictube_videos_v6',
    'quantictube_photos_v1',
    'quantictube_photos_v2',
    'quantictube_photos_v3',
    'quantictube_channels_customization_v1'
  ];
  obsoleteKeys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}

export function saveChannels(channels: ChannelCustomization[]): void {
  try {
    const sanitized = sanitizeChannelsForStorage(channels);
    localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (_e) {
    // QuotaExceededError recovery: clean obsolete keys and store compact payload
    try {
      cleanObsoleteStorageKeys();
      const compact = channels.map((c) => ({
        ...c,
        bannerUrl: c.bannerUrl?.startsWith('data:') ? 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif' : c.bannerUrl,
        avatar: c.avatar?.startsWith('data:') ? 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif' : c.avatar
      }));
      localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(compact));
    } catch (_recoveryErr) {
      // Memory persistence active during session
    }
  }
}

export function getChannelByHandle(handle: string): ChannelCustomization {
  const cleanHandle = (handle.startsWith('@') ? handle : `@${handle}`).toLowerCase();
  const channels = loadChannels();
  const found = channels.find(
    (c) =>
      c.handle.toLowerCase() === cleanHandle ||
      c.name.toLowerCase().includes(cleanHandle.replace('@', ''))
  );
  if (found) return found;

  // If user channel
  const userChannel = getUserChannel();
  if (userChannel.handle.toLowerCase() === cleanHandle) return userChannel;

  // Fallback to first channel or generate a fallback
  return DEFAULT_CHANNELS[0];
}

export function getUserChannel(): ChannelCustomization {
  try {
    const raw = localStorage.getItem(USER_ACTIVE_CHANNEL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        if (!parsed.bannerUrl || parsed.bannerUrl.includes('mixkit.co')) {
          parsed.bannerUrl = 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif';
          parsed.bannerType = 'gif';
        }
        return { ...parsed, isOwner: true };
      }
    }
  } catch {}

  const defaultUserChannel: ChannelCustomization = {
    id: 'user-my-channel',
    name: 'Mi Canal Cuántico',
    handle: '@mi_canal',
    bio: 'Bienvenido a mi canal oficial en QuanticTube. Contenido generado con IA Veo 3.1, audio espacial y videos holográficos.',
    avatar: 'https://media.giphy.com/media/d31vTpVi1LAcDvdm/giphy.gif',
    avatarType: 'gif',
    verified: true,
    subscribers: '1.2K',
    subscribersCount: 1200,
    bannerType: 'gif',
    bannerUrl: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
    ledColor: 'neon-green',
    ledAnimation: 'pulse',
    videoTitleAnimation: 'marquee',
    videoDescAnimation: 'ticker',
    accentTheme: 'emerald',
    isOwner: true,
    links: [{ title: 'Red QuanticTube', url: window?.location?.origin || 'https://quantictube.ai' }]
  };
  return defaultUserChannel;
}

export function saveUserChannel(updated: Partial<ChannelCustomization>): ChannelCustomization {
  const current = getUserChannel();
  const merged: ChannelCustomization = {
    ...current,
    ...updated,
    isOwner: true
  };
  try {
    localStorage.setItem(USER_ACTIVE_CHANNEL_KEY, JSON.stringify(merged));
  } catch (_e) {
    try {
      cleanObsoleteStorageKeys();
      const sanitized = sanitizeChannelsForStorage([merged])[0];
      localStorage.setItem(USER_ACTIVE_CHANNEL_KEY, JSON.stringify(sanitized));
    } catch {}
  }

  // Also update in all channels list
  const all = loadChannels();
  const existingIndex = all.findIndex((c) => c.id === merged.id || c.handle === merged.handle);
  if (existingIndex >= 0) {
    all[existingIndex] = merged;
  } else {
    all.push(merged);
  }
  saveChannels(all);
  return merged;
}

export function updateChannel(channel: ChannelCustomization): void {
  const all = loadChannels();
  const index = all.findIndex((c) => c.id === channel.id || c.handle === channel.handle);
  if (index >= 0) {
    all[index] = channel;
  } else {
    all.push(channel);
  }
  saveChannels(all);
  if (channel.isOwner) {
    try {
      localStorage.setItem(USER_ACTIVE_CHANNEL_KEY, JSON.stringify(channel));
    } catch {
      try {
        cleanObsoleteStorageKeys();
        const sanitized = sanitizeChannelsForStorage([channel])[0];
        localStorage.setItem(USER_ACTIVE_CHANNEL_KEY, JSON.stringify(sanitized));
      } catch {}
    }
  }
}
