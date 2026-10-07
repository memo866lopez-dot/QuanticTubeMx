import { PhotoItem, TextPostItem, GifItem } from '../types';

const PHOTOS_STORAGE_KEY = 'quantictube_photos_v1';
const POSTS_STORAGE_KEY = 'quantictube_posts_v1';
const GIFS_STORAGE_KEY = 'quantictube_gifs_v1';

// Initial Seed Photos (High quality Unsplash / Cyberpunk & Futuristic Aesthetic)
export const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    title: 'Metrópolis Neón 2099',
    description: 'Rascacielos holográficos con tránsito aéreo en el distrito central de Neo-México.',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    category: 'cyberpunk',
    creator: {
      name: 'CyberMex Lab',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      username: '@cybermex_lab',
      verified: true
    },
    metrics: { likes: 3420, views: 18900, shares: 890, downloads: 1250 },
    tags: ['#Cyberpunk', '#NeoMexico', '#NeonCity', '#Holograma'],
    resolution: '4K UltraHD (3840x2160)',
    createdAt: 'Hace 2 horas',
    isAiGenerated: false
  },
  {
    id: 'photo-2',
    title: 'Guerrera Synthwave con Katana Láser',
    description: 'Ilustración fotorrealista generada por IA con efectos de niebla y partículas verdes esmeralda.',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    category: 'ia-art',
    creator: {
      name: 'Nova Horizon IA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      username: '@novahorizon',
      verified: true
    },
    metrics: { likes: 5890, views: 27400, shares: 1420, downloads: 2310 },
    tags: ['#Synthwave', '#LaserKatana', '#VeoArt', '#EmeraldNeon'],
    resolution: '8K Render (7680x4320)',
    createdAt: 'Hace 5 horas',
    isAiGenerated: true
  },
  {
    id: 'photo-3',
    title: 'Templo Maya Cuántico 3044',
    description: 'Pirámide de Chichén Itzá reimaginada como un reactor cuántico de energía limpia.',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    category: 'futurista',
    creator: {
      name: 'Valeria Solaris',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      username: '@valeria_solaris',
      verified: true
    },
    metrics: { likes: 4120, views: 21900, shares: 960, downloads: 1680 },
    tags: ['#MayaFuturism', '#QuantumEnergy', '#ChichenItza3044'],
    resolution: '4K Cinema (4096x2160)',
    createdAt: 'Ayer',
    isAiGenerated: true
  },
  {
    id: 'photo-4',
    title: 'Autopista de Datos Hiperespacial',
    description: 'Líneas de fibra óptica y portales de comunicación en el ciberespacio.',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    category: 'wallpaper',
    creator: {
      name: 'HyperDrive Studio',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      username: '@hyperdrive_art',
      verified: false
    },
    metrics: { likes: 2950, views: 14200, shares: 640, downloads: 980 },
    tags: ['#Matrix', '#DataHighway', '#QuantumData', '#NeonGreen'],
    resolution: 'QuadHD (2560x1440)',
    createdAt: 'Hace 2 días',
    isAiGenerated: false
  },
  {
    id: 'photo-5',
    title: 'Androide de Asistencia con Ojos Neón',
    description: 'Retrato de la interfaz androide de seguridad de QuanticTube.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    category: 'neon',
    creator: {
      name: 'Memo Lopez',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      username: '@memolopez',
      verified: true
    },
    metrics: { likes: 7210, views: 35600, shares: 2100, downloads: 3450 },
    tags: ['#AndroidAI', '#CyberFace', '#QuantumAI', '#Portrait'],
    resolution: '5K Master (5120x2880)',
    createdAt: 'Hace 3 días',
    isAiGenerated: true
  }
];

// Initial Seed Community Posts with Text & Voice Notes
export const INITIAL_POSTS: TextPostItem[] = [
  {
    id: 'post-1',
    title: '🚀 Lanzamiento del Motor Quantum AI Connected',
    content: '¡Familia Quantic! Hoy activamos formalmente el protocolo Quantum AI Connected para comunicación continua manos libres. Ya pueden conversar en tiempo real, agendar recordatorios y explorar música synthwave con la voz cuántica más amigable del mundo. ¿Qué les parece la experiencia?',
    author: {
      name: 'Memo Lopez',
      username: '@memolopez',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      verified: true
    },
    createdAt: 'Hace 35 min',
    tags: ['#QuantumAI', '#Actualización', '#VozEnTiempoReal', '#QuanticTube'],
    hasVoiceNote: true,
    voiceDuration: 18,
    metrics: { likes: 1420, comments: 248, shares: 312 },
    reactions: { fire: 580, heart: 420, zap: 320, rocket: 280 }
  },
  {
    id: 'post-2',
    title: '⚡ Nueva función de generación de Beats con Veo 3.1',
    content: 'Estamos renderizando los primeros 100 fragmentos audiovisuales en 3D Book-Flip. Si aún no han probado el modo de 4 pantallas simultáneas Quad-View, ¡vayan a la pestaña y sientan el poder del streaming multicámara!',
    author: {
      name: 'CyberMex Lab',
      username: '@cybermex_lab',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      verified: true
    },
    createdAt: 'Hace 2 horas',
    tags: ['#Veo3', '#Beats', '#Synthwave', '#MultiView'],
    hasVoiceNote: false,
    metrics: { likes: 980, comments: 112, shares: 145 },
    reactions: { fire: 410, heart: 290, zap: 180, rocket: 160 }
  },
  {
    id: 'post-3',
    title: '🎙️ Nota de Voz: Reflexiones sobre el futuro del video holográfico',
    content: 'Grabé esta breve nota de voz para compartir mis predicciones sobre cómo los creadores interactuarán con los comentarios espaciales fijados dentro del video en 2030. ¡Déjenme sus respuestas y opiniones abajo!',
    author: {
      name: 'Valeria Solaris',
      username: '@valeria_solaris',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      verified: true
    },
    createdAt: 'Hace 4 horas',
    tags: ['#Holograma', '#AudioNote', '#Futurismo', '#Creadores'],
    hasVoiceNote: true,
    voiceDuration: 26,
    metrics: { likes: 810, comments: 94, shares: 88 },
    reactions: { fire: 290, heart: 310, zap: 140, rocket: 120 }
  }
];

// Initial Seed Animated GIFs & Loops
export const INITIAL_GIFS: GifItem[] = [
  {
    id: 'gif-1',
    title: 'Túnel Cyberpunk Neón Infinito',
    gifUrl: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200.gif',
    category: 'cyberpunk',
    tags: ['#Tunnel', '#Neon', '#Cyberpunk', '#Loop', '#Vaporwave'],
    creator: {
      name: 'NeonDreams Studio',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    metrics: { likes: 4520, shares: 1280, views: 24500 },
    dimensions: { width: 480, height: 480 },
    createdAt: 'Hace 1 hora'
  },
  {
    id: 'gif-2',
    title: 'Ecualizador Cuántico Holográfico',
    gifUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/200.gif',
    category: 'neon',
    tags: ['#Equalizer', '#Soundwave', '#Quantum', '#MusicBeat'],
    creator: {
      name: 'AudioPulse IA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    metrics: { likes: 3890, shares: 940, views: 19800 },
    dimensions: { width: 500, height: 280 },
    createdAt: 'Hace 3 horas'
  },
  {
    id: 'gif-3',
    title: 'Auto Synthwave Conduciendo hacia el Sol Púrpura',
    gifUrl: 'https://media.giphy.com/media/d2Z9QYzA2aidiWn6/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/d2Z9QYzA2aidiWn6/200.gif',
    category: 'synthwave',
    tags: ['#Outrun', '#Synthwave', '#Retrowave', '#Drive', '#80s'],
    creator: {
      name: 'RetroGrid 1984',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
    },
    metrics: { likes: 6240, shares: 1890, views: 38200 },
    dimensions: { width: 480, height: 270 },
    createdAt: 'Ayer'
  },
  {
    id: 'gif-4',
    title: 'Cerebro IA Conexión Neuronal',
    gifUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/200.gif',
    category: 'ia',
    tags: ['#AIBrain', '#NeuralNetwork', '#QuantumAI', '#Synapse'],
    creator: {
      name: 'Quantum Core',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    },
    metrics: { likes: 5120, shares: 1430, views: 29400 },
    dimensions: { width: 500, height: 350 },
    createdAt: 'Hace 2 días'
  },
  {
    id: 'gif-5',
    title: 'Pixel Art Cyber Samurai Reacción',
    gifUrl: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/200.gif',
    category: 'anime',
    tags: ['#PixelArt', '#Samurai', '#Cyberpunk', '#Reaction'],
    creator: {
      name: 'AnimeCyber FX',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
    },
    metrics: { likes: 4180, shares: 1110, views: 22100 },
    dimensions: { width: 400, height: 400 },
    createdAt: 'Hace 3 días'
  }
];

// LocalStorage helpers for Photos
export function getStoredPhotos(): PhotoItem[] {
  if (typeof window === 'undefined') return INITIAL_PHOTOS;
  try {
    const raw = localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(INITIAL_PHOTOS));
      return INITIAL_PHOTOS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PHOTOS;
  }
}

export function savePhotos(photos: PhotoItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {}
}

export function addPhoto(photo: PhotoItem): PhotoItem[] {
  const current = getStoredPhotos();
  const updated = [photo, ...current];
  savePhotos(updated);
  return updated;
}

// LocalStorage helpers for Posts
export function getStoredPosts(): TextPostItem[] {
  if (typeof window === 'undefined') return INITIAL_POSTS;
  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_POSTS;
  }
}

export function savePosts(posts: TextPostItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {}
}

export function addPost(post: TextPostItem): TextPostItem[] {
  const current = getStoredPosts();
  const updated = [post, ...current];
  savePosts(updated);
  return updated;
}

// LocalStorage helpers for GIFs
export function getStoredGifs(): GifItem[] {
  if (typeof window === 'undefined') return INITIAL_GIFS;
  try {
    const raw = localStorage.getItem(GIFS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GIFS_STORAGE_KEY, JSON.stringify(INITIAL_GIFS));
      return INITIAL_GIFS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_GIFS;
  }
}

export function saveGifs(gifs: GifItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GIFS_STORAGE_KEY, JSON.stringify(gifs));
  } catch (e) {}
}

export function addGif(gif: GifItem): GifItem[] {
  const current = getStoredGifs();
  const updated = [gif, ...current];
  saveGifs(updated);
  return updated;
}
