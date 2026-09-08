export interface Pixel {
  x: number;
  y: number;
  color: string;
  author: string;
  timestamp: number;
}

export interface ChunkKey {
  cx: number;
  cy: number;
}

export interface PlayerCursor {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  lastActive: number;
  isDrawing?: boolean;
}

export type ToolType = 'pencil' | 'brush' | 'line' | 'rect' | 'eraser' | 'picker';

export interface Landmark {
  id: string;
  name: string;
  icon: string;
  description: string;
  x: number;
  y: number;
  pixelsCount: number;
  tags: string[];
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  badge: string;
  type: 'rush' | 'community' | 'color_bonus' | 'border_war' | 'hidden_art';
  bonusText: string;
  endsAt: number;
  targetRegion?: { x1: number; y1: number; x2: number; y2: number };
}

export interface ActivityItem {
  id: string;
  type: 'pixel' | 'artwork' | 'clan' | 'event' | 'chat';
  author: string;
  text: string;
  timestamp: number;
  coords?: { x: number; y: number };
}

export interface UserProfile {
  username: string;
  avatarColor: string;
  pixelsPlaced: number;
  favoriteColor: string;
  level: number;
  daysActive: number;
  achievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
}

export const WORLD_SIZE = 10000;
export const CHUNK_SIZE = 128; // 128x128 pixels per chunk

export const DEFAULT_PALETTE = [
  '#000000', '#3E3E3E', '#8E8E93', '#FFFFFF',
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759',
  '#00C7BE', '#30B0C7', '#007AFF', '#5856D6',
  '#AF52DE', '#FF2D55', '#A2845E', '#E056FD',
  '#68D391', '#F6E05E', '#4FD1C5', '#F687B3',
  '#63B3ED', '#FC8181', '#B794F4', '#CBD5E0'
];
