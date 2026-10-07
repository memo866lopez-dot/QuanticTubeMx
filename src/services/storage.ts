import { VideoItem, PhotoItem, TextPostItem, GifItem } from '../types';
import { getSafeVideoUrl } from './videoBlobService';

const VIDEOS_STORAGE_KEY = 'quantictube_videos_v7';
const DELETED_VIDEOS_STORAGE_KEY = 'quantictube_deleted_videos_v1';
const PHOTOS_STORAGE_KEY = 'quantictube_photos_v4';
const POSTS_STORAGE_KEY = 'quantictube_posts_v4';
const GIFS_STORAGE_KEY = 'quantictube_gifs_v4';

export function getDeletedVideoIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_VIDEOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

export function markVideoAsDeleted(videoId: string): void {
  try {
    const set = getDeletedVideoIds();
    set.add(videoId);
    localStorage.setItem(DELETED_VIDEOS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: `CDMX ${new Date().getFullYear()}: Neotitlán Cyberpunk en Hyperloop`,
    description: 'Recorrido en primera persona por el nuevo sistema de trenes cuánticos flotantes sobre Paseo de la Reforma a 1,200 km/h. Luces de neón esmeralda y pirámides holográficas.',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    format: '16:9',
    creator: {
      name: 'Dr. Quetzal Cyber',
      username: '@quetzal_ai',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      verified: true,
      followers: '1.4M'
    },
    metrics: {
      views: 842100,
      likes: 95400,
      comments: 3120,
      shares: 12400
    },
    tags: ['#CDMX', '#Neotitlan', '#Cyberpunk', '#Hyperloop', '#QuanticTube'],
    duration: 180,
    publishedAt: 'Hace 2 horas',
    pins: [
      {
        id: 'pin-1',
        xPercent: 42,
        yPercent: 38,
        timeSeconds: 4,
        author: 'Valeria_Futurista',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        text: '¡Esa torre con el escudo del águila en holograma está épica!',
        createdAt: '12m'
      },
      {
        id: 'pin-2',
        xPercent: 68,
        yPercent: 62,
        timeSeconds: 8,
        author: 'TechMariachi',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        text: 'Miren la velocidad del pulso de plasma verde',
        createdAt: '5m'
      }
    ]
  },
  {
    id: 'vid-2',
    title: 'Mariachi Synthwave: Concierto en Vivo en el Zócalo Holográfico',
    description: 'Guitarras de plasma, trompetas sintetizadas y trajes con circuitos LED tricolor. La banda Neón Charros rompe el récord de 10 millones de espectadores en QuanticTube Omni-Live.',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    format: '16:9',
    creator: {
      name: `Mariachi Neon ${new Date().getFullYear()}`,
      username: '@mariachi_synth',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80',
      verified: true,
      followers: '3.8M'
    },
    metrics: {
      views: 1250000,
      likes: 215000,
      comments: 8900,
      shares: 34100
    },
    tags: ['#Mariachi', '#Synthwave', '#QuanticTubeLive', '#MusicaIA'],
    duration: 210,
    publishedAt: 'Hace 5 horas',
    pins: [
      {
        id: 'pin-3',
        xPercent: 50,
        yPercent: 45,
        timeSeconds: 2,
        author: 'SynthLover',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: '¡El solo de trompeta cuántica me puso la piel chinita!',
        createdAt: '22m'
      }
    ]
  },
  {
    id: 'vid-3',
    title: `Tacos Al Pastor ${new Date().getFullYear()}: Trompo con Láser y Salsa de Plasma`,
    description: 'Short vertical: ¿Cómo se sirven los mejores tacos del futuro en Neotitlán? Cortados a 3,000 grados con precisión micrométrica por el androide Taquero-X.',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
    format: '9:16',
    creator: {
      name: 'Chef CyberTaquero',
      username: '@tacos_del_futuro',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      verified: true,
      followers: '890K'
    },
    metrics: {
      views: 3420000,
      likes: 489000,
      comments: 14200,
      shares: 68000
    },
    tags: ['#TacosAlPastor', '#Shorts', '#CyberGastronomia', '#RobotTaquero'],
    duration: 15,
    publishedAt: 'Ayer',
    pins: [
      {
        id: 'pin-4',
        xPercent: 55,
        yPercent: 50,
        timeSeconds: 5,
        author: 'Gourmet_Space',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
        text: 'Con piña voladora por antigravedad 🍍🌮',
        createdAt: '1h'
      }
    ]
  },
  {
    id: 'vid-4',
    title: 'Lucha Libre Mecha en la Arena México Estelar',
    description: 'Titan Plateado vs Destructor Azteca: Los exoesqueletos biomecánicos saltan desde la tercera cuerda a 15 metros de altura con propulsores iónicos.',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    format: '9:16',
    creator: {
      name: 'Lucha Mecha League',
      username: '@lucha_mecha',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      verified: true,
      followers: '2.1M'
    },
    metrics: {
      views: 1820000,
      likes: 310000,
      comments: 9800,
      shares: 41000
    },
    tags: ['#LuchaLibre', '#Mechas', '#ArenaMexico', '#Futurista'],
    duration: 15,
    publishedAt: 'Hace 3 días',
    pins: []
  },
  {
    id: 'vid-5',
    title: 'Generación Veo 3.1: Pirámides de Chichén Itzá en Marte',
    description: 'Video 100% generado por IA en QuanticStudio usando el motor Veo 3.1 con texturas de 4K HDR e iluminación ambiental de soles gemelos.',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    format: '16:9',
    creator: {
      name: 'QuanticTube AI Lab',
      username: '@quantictube_lab',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      verified: true,
      followers: '5.2M'
    },
    metrics: {
      views: 5210000,
      likes: 670000,
      comments: 24500,
      shares: 98000
    },
    tags: ['#Veo3', '#IA', '#Marte', '#ChichenItza', '#QuanticTube'],
    duration: 60,
    isAIGenerated: true,
    publishedAt: 'Hace 1 hora',
    pins: []
  },
  {
    id: 'vid-6',
    title: 'Carrera de Drones Quánticos sobre Popocatépetl 4K',
    description: 'Vuelo supersónico a través de ceniza luminiscente y campos electromagnéticos del volcán en Neotitlán.',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    format: '16:9',
    creator: {
      name: 'AeroDrones MX',
      username: '@aerodrones_mx',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      verified: true,
      followers: '920K'
    },
    metrics: {
      views: 740000,
      likes: 81200,
      comments: 2900,
      shares: 11000
    },
    tags: ['#Drones', '#Volcan', '#Neotitlan', '#QuanticTube'],
    duration: 120,
    publishedAt: 'Hace 6 horas',
    pins: []
  }
];

export const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    title: 'Rascacielos Neón y Tráfico Holográfico en Neotitlán',
    description: 'Fotografía panorámica 8K de las arterias cuánticas en la medianoche futurista.',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
    category: 'cyberpunk',
    creator: {
      name: 'Valeria_Futurista',
      username: '@valeria_cyber',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    metrics: {
      likes: 84200,
      views: 290000,
      shares: 4200,
      downloads: 8900
    },
    tags: ['#Cyberpunk', '#CDMX', '#Neon', '#8K'],
    createdAt: 'Hace 2 horas'
  },
  {
    id: 'photo-2',
    title: 'Guerrero Jaguar Mecha en el Zócalo',
    description: 'Render con Veo 3.1 & IA mostrando armadura con circuitos de jade electroluminiscente.',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    category: 'ia-art',
    creator: {
      name: 'Dr. Quetzal Cyber',
      username: '@quetzal_ai',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    metrics: {
      likes: 125000,
      views: 450000,
      shares: 9800,
      downloads: 14500
    },
    tags: ['#IA', '#Jaguar', '#Mecha', '#Jade'],
    createdAt: 'Hace 5 horas'
  }
];

export const INITIAL_POSTS: TextPostItem[] = [
  {
    id: 'post-1',
    title: '¡Lanzamiento Oficial de QuanticTube en la Red Cuántica!',
    content: 'Comunidad: Hoy iniciamos la era de las plataformas sociales impulsadas por física 3D de pañuelo, transmisiones con WebRTC, síntesis musical procedural y control automatizado de IA.',
    author: {
      name: 'Memo Lopez',
      username: '@memolopez',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      verified: true
    },
    metrics: {
      likes: 1420,
      comments: 340,
      shares: 210
    },
    reactions: {
      heart: 1420,
      fire: 890,
      zap: 450,
      rocket: 320
    },
    tags: ['#QuanticTube', '#Lanzamiento', '#Innovacion'],
    createdAt: 'Hace 1 hora'
  }
];

export const INITIAL_GIFS: GifItem[] = [
  {
    id: 'gif-1',
    title: 'Bucle Neón Infinito Cyberpunk',
    gifUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    category: 'neon',
    creator: {
      name: 'SynthwaveLab',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80'
    },
    metrics: {
      likes: 45200,
      views: 180000,
      shares: 12000
    },
    tags: ['#Loop', '#Cyberpunk', '#Neon'],
    createdAt: 'Hace 4 horas'
  }
];

// Videos storage
export function loadVideos(): VideoItem[] {
  const deletedIds = getDeletedVideoIds();
  try {
    let raw = localStorage.getItem(VIDEOS_STORAGE_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem('quantictube_videos_v6');
      if (oldRaw) raw = oldRaw;
    }
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        const sanitized = parsed
          .filter((v: VideoItem) => !deletedIds.has(v.id))
          .map((v: VideoItem) => {
            // If it matches an INITIAL_VIDEO, ensure it has the verified working URL
            const initialMatch = INITIAL_VIDEOS.find((iv) => iv.id === v.id);
            if (initialMatch) {
              return {
                ...v,
                videoUrl: initialMatch.videoUrl
              };
            }
            // For user-created videos: preserve their exact videoUrl if valid, else sanitize
            const safeUrl = getSafeVideoUrl(v.videoUrl, v.format, v.id);
            return {
              ...v,
              videoUrl: safeUrl
            };
          });
        saveVideos(sanitized);
        return sanitized;
      }
    }
  } catch (err) {
    console.warn('Could not read stored videos:', err);
  }
  const defaults = INITIAL_VIDEOS.filter((v) => !deletedIds.has(v.id));
  saveVideos(defaults);
  return defaults;
}

export function saveVideos(videos: VideoItem[]): void {
  try {
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(videos));
  } catch (err) {
    console.warn('Could not save videos to localStorage:', err);
  }
}

export function addVideoToFeed(newVideo: VideoItem): VideoItem[] {
  const current = loadVideos();
  const updated = [newVideo, ...current];
  saveVideos(updated);
  return updated;
}

export function removeVideoFromFeed(videoId: string): VideoItem[] {
  markVideoAsDeleted(videoId);
  const current = loadVideos();
  const updated = current.filter((v) => v.id !== videoId);
  saveVideos(updated);
  return updated;
}

// Photos storage
export function loadPhotos(): PhotoItem[] {
  try {
    const raw = localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {}
  return INITIAL_PHOTOS;
}

export function savePhotos(photos: PhotoItem[]): void {
  try {
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
  } catch (err) {}
}

// Posts storage
export function loadPosts(): TextPostItem[] {
  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {}
  return INITIAL_POSTS;
}

export function savePosts(posts: TextPostItem[]): void {
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (err) {}
}

// GIFs storage
export function loadGifs(): GifItem[] {
  try {
    const raw = localStorage.getItem(GIFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {}
  return INITIAL_GIFS;
}

export function saveGifs(gifs: GifItem[]): void {
  try {
    localStorage.setItem(GIFS_STORAGE_KEY, JSON.stringify(gifs));
  } catch (err) {}
}

// Aliases for compatibility
export const initialVideos = INITIAL_VIDEOS;
export const initialPhotos = INITIAL_PHOTOS;
export const initialPosts = INITIAL_POSTS;
export const initialGifs = INITIAL_GIFS;
export const getStoredVideos = loadVideos;
