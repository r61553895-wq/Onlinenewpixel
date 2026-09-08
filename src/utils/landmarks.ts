import { Landmark, Pixel } from '../types';

export const LANDMARKS: Landmark[] = [
  {
    id: 'cyber_dragon',
    name: 'Cyber Dragon',
    icon: '🔥',
    description: 'A colossal mechanical dragon constructed by DragonClan at the world center.',
    x: 5000,
    y: 5000,
    pixelsCount: 4820,
    tags: ['Clan', 'Artwork', 'Center']
  },
  {
    id: 'neon_cat',
    name: 'Neon Cat',
    icon: '🐱',
    description: 'Vibrant pop-art feline illuminated in high-contrast neon cyan and magenta.',
    x: 7200,
    y: 6100,
    pixelsCount: 2940,
    tags: ['Art', 'Community']
  },
  {
    id: 'citadel',
    name: 'Iron Citadel',
    icon: '🏰',
    description: 'Detailed isometric stone fortress with banners and defensive battlements.',
    x: 2400,
    y: 3100,
    pixelsCount: 6150,
    tags: ['Medieval', 'Mega-Structure']
  },
  {
    id: 'space_station',
    name: 'Orbital Station Alpha',
    icon: '🚀',
    description: 'Futuristic satellite array with rotating solar panels and docking modules.',
    x: 8100,
    y: 2400,
    pixelsCount: 3880,
    tags: ['Sci-Fi', 'Space']
  },
  {
    id: 'tree_of_life',
    name: 'Ancient Yggdrasil',
    icon: '🌳',
    description: 'Sprawling pixel tree with glowing runic foliage and winding roots.',
    x: 3600,
    y: 7800,
    pixelsCount: 5200,
    tags: ['Nature', 'Sanctuary']
  },
  {
    id: 'clan_frontline',
    name: 'Sector 42 Frontline',
    icon: '⚔️',
    description: 'Active contested territory where Crimson Vanguard and Azure Legion battle.',
    x: 4920,
    y: 5120,
    pixelsCount: 8300,
    tags: ['Warzone', 'Active Event']
  }
];

/** Generate initial pixel art clusters for landmarks */
export function generateLandmarkPixels(landmark: Landmark): Pixel[] {
  const pixels: Pixel[] = [];
  const cx = landmark.x;
  const cy = landmark.y;
  const baseTime = Date.now() - 3600000;

  if (landmark.id === 'cyber_dragon') {
    // Generate an impressive stylized pixel dragon head and wings
    const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#111214', '#E056FD', '#FFFFFF'];
    const radius = 35;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > radius) continue;

        // Dragon silhouette & flames
        const angle = Math.atan2(dy, dx);
        const wave = Math.sin(angle * 5 + d * 0.2);
        if (d < 12 || (d < radius && wave > -0.2)) {
          let color = '#FF3B30';
          if (d < 6) color = '#FFCC00';
          else if (wave > 0.6) color = '#FF9500';
          else if (Math.abs(dx) < 3 && dy < -5) color = '#FFFFFF'; // eyes/fangs
          else if (d > 28) color = '#E056FD';

          pixels.push({
            x: cx + dx,
            y: cy + dy,
            color,
            author: '@DragonLord',
            timestamp: baseTime + (dx + dy) * 1000
          });
        }
      }
    }
  } else if (landmark.id === 'neon_cat') {
    // Stylized cat face
    const radius = 25;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const inHead = (dx * dx) / (20 * 20) + (dy * dy) / (18 * 18) <= 1;
        const leftEar = dx < -6 && dx > -22 && dy < -10 && dy > -28 && (dy - dx < -2);
        const rightEar = dx > 6 && dx < 22 && dy < -10 && dy > -28 && (dy + dx < -2);

        if (inHead || leftEar || rightEar) {
          let color = '#00C7BE'; // Cyan
          // Eyes
          if ((Math.abs(dx - 8) < 3 && Math.abs(dy + 2) < 4) || (Math.abs(dx + 8) < 3 && Math.abs(dy + 2) < 4)) {
            color = '#FFCC00';
          } else if ((Math.abs(dx - 8) < 1 && Math.abs(dy + 2) < 2) || (Math.abs(dx + 8) < 1 && Math.abs(dy + 2) < 2)) {
            color = '#111214'; // Pupils
          } else if (Math.abs(dx) < 2 && Math.abs(dy - 4) < 2) {
            color = '#FF2D55'; // Nose
          } else if (dy > 8 && Math.abs(dx) < 12) {
            color = '#30B0C7'; // Chin
          }
          pixels.push({
            x: cx + dx,
            y: cy + dy,
            color,
            author: '@NekoArtist',
            timestamp: baseTime + dx * 2000
          });
        }
      }
    }
  } else if (landmark.id === 'citadel') {
    // Castle fortress
    const w = 44;
    const h = 36;
    for (let dy = -h / 2; dy <= h / 2; dy++) {
      for (let dx = -w / 2; dx <= w / 2; dx++) {
        const isWall = Math.abs(dx) < 18 && dy > -10;
        const isTowerL = dx >= -22 && dx <= -14 && dy >= -18;
        const isTowerR = dx >= 14 && dx <= 22 && dy >= -18;
        const isBattlement = (dy === -11 || dy === -19) && Math.abs(dx) % 4 < 2;

        if (isWall || isTowerL || isTowerR || isBattlement) {
          let color = '#8E8E93';
          if ((Math.abs(dx) + Math.abs(dy)) % 6 === 0) color = '#3E3E3E'; // Brick texture
          if (dy > 10 && Math.abs(dx) < 5) color = '#A2845E'; // Wooden gate
          if (dy === -19 && (dx === -18 || dx === 18)) color = '#FF3B30'; // Tower flag

          pixels.push({
            x: Math.round(cx + dx),
            y: Math.round(cy + dy),
            color,
            author: '@StoneMason',
            timestamp: baseTime + dy * 1500
          });
        }
      }
    }
  } else if (landmark.id === 'space_station') {
    // Space satellite
    for (let i = -30; i <= 30; i++) {
      for (let j = -15; j <= 15; j++) {
        // Core hub
        const isCore = i * i + j * j <= 80;
        // Solar panels left & right
        const isPanelL = i < -8 && i > -28 && Math.abs(j) < 6;
        const isPanelR = i > 8 && i < 28 && Math.abs(j) < 6;
        // Truss
        const isTruss = Math.abs(j) <= 1 && Math.abs(i) <= 28;

        if (isCore || isPanelL || isPanelR || isTruss) {
          let color = '#CBD5E0';
          if (isPanelL || isPanelR) {
            color = (i + j) % 2 === 0 ? '#007AFF' : '#63B3ED';
          } else if (isCore) {
            color = Math.abs(i) < 3 && Math.abs(j) < 3 ? '#FFCC00' : '#FFFFFF';
          }
          pixels.push({
            x: cx + i,
            y: cy + j,
            color,
            author: '@AstroPixel',
            timestamp: baseTime + i * 800
          });
        }
      }
    }
  } else if (landmark.id === 'tree_of_life') {
    // Majestic pixel tree
    const trunkW = 8;
    const trunkH = 26;
    for (let dy = -30; dy <= 20; dy++) {
      for (let dx = -26; dx <= 26; dx++) {
        const isTrunk = dy > 0 && Math.abs(dx) < trunkW - dy * 0.15;
        const isCanopy = dy <= 5 && (dx * dx) / (24 * 24) + ((dy + 12) * (dy + 12)) / (18 * 18) <= 1;

        if (isTrunk || isCanopy) {
          let color = '#34C759';
          if (isTrunk) {
            color = (dx + dy) % 3 === 0 ? '#5A3E26' : '#A2845E';
          } else {
            if ((dx + dy) % 7 === 0) color = '#00C7BE'; // Glowing runes
            else if (dy < -14) color = '#68D391';
            else color = '#34C759';
          }
          pixels.push({
            x: cx + dx,
            y: cy + dy,
            color,
            author: '@GaiaGuild',
            timestamp: baseTime + dx * 1200
          });
        }
      }
    }
  } else if (landmark.id === 'clan_frontline') {
    // Contested warzone
    for (let dy = -25; dy <= 25; dy++) {
      for (let dx = -25; dx <= 25; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 32) {
          const isRed = dx < dy;
          const border = Math.abs(dx - dy) < 2;
          let color = border ? '#FFFFFF' : (isRed ? '#FF3B30' : '#007AFF');
          if ((dx * dy) % 5 === 0 && !border) {
            color = isRed ? '#FF9500' : '#30B0C7';
          }
          pixels.push({
            x: cx + dx,
            y: cy + dy,
            color,
            author: isRed ? '@CrimsonGuard' : '@AzureKnight',
            timestamp: baseTime + (dx - dy) * 900
          });
        }
      }
    }
  }

  return pixels;
}
