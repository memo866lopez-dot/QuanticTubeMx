export type VideoFormat = '16:9' | '9:16';

export interface CommentPin {
  id: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  timeSeconds: number;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
  isVoice?: boolean;
  voiceUrl?: string;
  audioDuration?: number;
  fontFamily?: string;
  textColor?: string;
  fontSize?: string;
  likes?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  format: VideoFormat;
  creator: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    followers: string;
  };
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  tags: string[];
  duration: number; // seconds
  publishedAt: string;
  isLive?: boolean;
  isAIGenerated?: boolean;
  aiPrompt?: string;
  pins: CommentPin[];
}

export interface LiveGift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  color: string;
  particleCount: number;
}

export interface LiveChatMessage {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  timestamp: string;
  isGift?: boolean;
  giftName?: string;
  giftIcon?: string;
  isSuperChat?: boolean;
  amount?: string;
  isModerator?: boolean;
  isBanned?: boolean;
}

export interface LiveGuest {
  id: string;
  name: string;
  avatar: string;
  status: 'pending' | 'on_stage';
  streamUrl?: string;
}

export interface AudioNote {
  id: string;
  sender: string;
  timestamp: string;
  duration: number;
  audioBlobUrl: string;
}

export interface TaskReminder {
  id: string;
  title: string;
  datetime: string; // ISO string or YYYY-MM-DDTHH:mm
  completed: boolean;
  notified: boolean;
  category: 'tarea' | 'recordatorio' | 'alarma';
}

export interface AgentMemory {
  userName: string;
  favoriteVideoId: string;
  favoriteVideoTitle: string;
  alarmTime: string; // e.g. "07:30"
  alarmEnabled: boolean;
  tasks: TaskReminder[];
  notes: string[];
}

export interface PhotoItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'cyberpunk' | 'neon' | 'synthwave' | 'ia-art' | 'wallpaper' | 'futurista';
  creator: {
    name: string;
    avatar: string;
    username: string;
    verified: boolean;
  };
  metrics: {
    likes: number;
    views: number;
    shares: number;
    downloads: number;
  };
  tags: string[];
  resolution?: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

export interface TextPostItem {
  id: string;
  title?: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    verified: boolean;
  };
  createdAt: string;
  tags: string[];
  hasVoiceNote?: boolean;
  voiceNoteUrl?: string;
  voiceDuration?: number; // seconds
  metrics: {
    likes: number;
    comments: number;
    shares: number;
  };
  reactions: {
    fire: number;
    heart: number;
    zap: number;
    rocket: number;
  };
}

export interface GifItem {
  id: string;
  title: string;
  gifUrl: string;
  previewUrl: string;
  category: 'cyberpunk' | 'anime' | 'synthwave' | 'neon' | 'memes' | 'reactions' | 'ia';
  tags: string[];
  creator: {
    name: string;
    avatar: string;
  };
  metrics: {
    likes: number;
    shares: number;
    views: number;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  createdAt: string;
}

export interface ShareItemData {
  type: 'video' | 'short' | 'photo' | 'post' | 'gif';
  id: string;
  title: string;
  url: string;
  previewImage?: string;
  description?: string;
  author?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  channelName: string;
  channelDescription?: string;
  isCreator: boolean;
  subscribers?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  bio?: string;
  channelName?: string;
  subscribersCount?: number;
  isVerified?: boolean;
  role?: 'user' | 'creator' | 'vip';
  createdAt: string;
}

export interface ConnectedUserChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSelf: boolean;
}

export interface ConnectedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isCreator: boolean;
  channelName?: string;
  channelSubscribers?: string;
  isOnline: boolean;
  isCurrentUser?: boolean;
  cameraActive: boolean;
  micActive: boolean;
  videoStreamUrl?: string; // sample video loop or 'webrtc'
  statusText?: string;
  inCall?: boolean;
  callType?: 'video' | 'audio';
  chatMessages: ConnectedUserChatMessage[];
}

export type ChannelLedColor =
  | 'neon-green' // #00ff88
  | 'cyber-pink' // #ff007f
  | 'quantum-blue' // #00d4ff
  | 'solar-gold' // #ffb800
  | 'synth-purple' // #a855f7
  | 'laser-red' // #ff2244
  | 'laser-white'; // #ffffff

export type ChannelLedAnimation =
  | 'pulse' // Palpitar rítmico suave
  | 'flash' // Flash estroboscópico cyber
  | 'glow' // Resplandor continuo intenso
  | 'wave'; // Onda gradiente neón

export interface ChannelCustomization {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  avatarType?: 'image' | 'gif' | 'video';
  verified: boolean;
  subscribers: string;
  subscribersCount: number;
  bannerType: 'video' | 'gif' | 'image';
  bannerUrl: string; // MP4 loop, GIF animado o imagen
  bannerMotionSpeed?: number;
  ledColor: ChannelLedColor;
  ledAnimation: ChannelLedAnimation;
  videoTitleAnimation: 'marquee' | 'neon-pulse' | 'wave' | 'static';
  videoDescAnimation: 'ticker' | 'glow-fade' | 'smooth' | 'static';
  accentTheme: string;
  links?: { title: string; url: string }[];
  isOwner?: boolean;
}

