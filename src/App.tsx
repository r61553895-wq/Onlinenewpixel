import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChunkManager } from './utils/chunkManager';
import { MultiplayerClient } from './utils/multiplayer';
import { sound } from './utils/audio';
import { LANDMARKS, generateLandmarkPixels } from './utils/landmarks';
import {
  Achievement,
  ActivityItem,
  Landmark,
  Pixel,
  PlayerCursor,
  ToolType,
  UserProfile,
  WorldEvent,
  WORLD_SIZE
} from './types';

// UI Components
import { CanvasViewport } from './components/CanvasViewport';
import { TopBar } from './components/TopBar';
import { BottomToolbar } from './components/BottomToolbar';
import { MiniMap } from './components/MiniMap';
import { PixelInspector } from './components/PixelInspector';
import { TrendingDrawer } from './components/TrendingDrawer';
import { ProfileModal } from './components/ProfileModal';
import { ActivityTicker } from './components/ActivityTicker';
import { EventBanner } from './components/EventBanner';
import { ShortcutsModal } from './components/ShortcutsModal';
import { LoadingScreen } from './components/LoadingScreen';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_pixel',
    title: 'First Pixel',
    description: 'Place your very first pixel onto the global canvas.',
    icon: '🎯',
    progress: 0,
    maxProgress: 1,
    unlocked: false
  },
  {
    id: 'builder',
    title: 'World Builder',
    description: 'Place 100 pixels to leave your mark on the universe.',
    icon: '🧱',
    progress: 0,
    maxProgress: 100,
    unlocked: false
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Create pixel art during the late night hours.',
    icon: '🦉',
    progress: 1,
    maxProgress: 1,
    unlocked: true
  },
  {
    id: 'explorer',
    title: 'Global Explorer',
    description: 'Visit 5 major community landmark monuments.',
    icon: '🧭',
    progress: 1,
    maxProgress: 5,
    unlocked: false
  },
  {
    id: 'team_player',
    title: 'Team Player',
    description: 'Contribute pixels to an active collaborative zone.',
    icon: '🤝',
    progress: 0,
    maxProgress: 1,
    unlocked: false
  }
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Core Engine & Chunk Manager
  const chunkManagerRef = useRef<ChunkManager>(new ChunkManager());
  const chunkManager = chunkManagerRef.current;

  // Camera State (starts at Cyber Dragon center 5000:5000 with crisp 6x zoom)
  const [camX, setCamX] = useState<number>(5000);
  const [camY, setCamY] = useState<number>(5000);
  const [zoom, setZoom] = useState<number>(6.0);

  // Drawing Tools State
  const [selectedColor, setSelectedColor] = useState<string>('#FF3B30');
  const [recentColors, setRecentColors] = useState<string[]>(['#FF3B30', '#FF9500', '#00C7BE', '#FFFFFF']);
  const [selectedTool, setSelectedTool] = useState<ToolType>('pencil');
  const [brushSize, setBrushSize] = useState<number>(1);

  // Cooldown State (seconds)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const baseCooldown = 4.0;
  const [activeEvent, setActiveEvent] = useState<WorldEvent | null>(null);

  // Effective cooldown depends on active event (e.g. Pixel Rush cuts it in half)
  const maxCooldown = activeEvent?.type === 'rush' ? baseCooldown * 0.5 : baseCooldown;

  // Sound State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Online & Multiplayer State
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'reconnecting' | 'offline'>('reconnecting');
  const [remoteCursors, setRemoteCursors] = useState<PlayerCursor[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Contextual Pixel Inspector State
  const [inspectCoords, setInspectCoords] = useState<{ x: number; y: number } | null>(null);
  const [inspectedPixel, setInspectedPixel] = useState<Pixel | null>(null);

  // Modals & Panels
  const [isTrendingOpen, setIsTrendingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // Player Profile State (with local storage persistence)
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('pixel_world_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const randId = Math.floor(Math.random() * 900) + 100;
    return {
      username: `PixelArtist_${randId}`,
      avatarColor: '#FF3B30',
      pixelsPlaced: 0,
      favoriteColor: '#FF3B30',
      level: 1,
      daysActive: 1,
      achievements: []
    };
  });
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  const multiplayerClientRef = useRef<MultiplayerClient | null>(null);

  // Persist profile to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('pixel_world_user_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  // Seed Landmark pixels once on startup
  useEffect(() => {
    for (const lm of LANDMARKS) {
      const landmarkPixels = generateLandmarkPixels(lm);
      chunkManager.setPixelsBatch(landmarkPixels, false);
    }
  }, [chunkManager]);

  // Cooldown countdown loop
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next === 0) {
          sound.playReady();
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Initialize Real Multiplayer Client
  useEffect(() => {
    const client = new MultiplayerClient(
      {
        onPixelPlaced: (pixel: Pixel, isRemote: boolean) => {
          chunkManager.setPixel(pixel, true);
          if (isRemote) {
            // Update inspected pixel if currently open on this cell
            setInspectCoords((currentCoords) => {
              if (currentCoords && currentCoords.x === pixel.x && currentCoords.y === pixel.y) {
                setInspectedPixel(pixel);
              }
              return currentCoords;
            });
          }
        },
        onInitialPixelsLoaded: (pixels: Pixel[]) => {
          // Batch apply all real pixels loaded from SQLite database
          chunkManager.setPixelsBatch(pixels, false);
        },
        onCursorUpdate: (cursors) => {
          setRemoteCursors(cursors);
        },
        onOnlineCount: (count) => {
          setOnlineCount(count);
        },
        onActivity: (item) => {
          setActivities((prev) => {
            // deduplicate
            if (prev.some((a) => a.id === item.id)) return prev;
            return [item, ...prev.slice(0, 50)];
          });
        },
        onStatusChange: (status) => {
          setNetworkStatus(status);
        },
        onEventChange: (event) => {
          setActiveEvent(event);
        }
      },
      profile.username,
      profile.avatarColor
    );

    multiplayerClientRef.current = client;

    return () => {
      client.destroy();
    };
  }, [chunkManager, profile.username, profile.avatarColor]);

  // Camera change handler
  const handleCameraChange = useCallback((x: number, y: number, newZoom: number) => {
    setCamX(x);
    setCamY(y);
    setZoom(newZoom);
  }, []);

  // Place a Pixel action
  const handleDrawPixel = useCallback(
    (x: number, y: number, color: string) => {
      if (cooldownRemaining > 0) return;

      const pixel: Pixel = {
        x,
        y,
        color,
        author: `@${profile.username}`,
        timestamp: Date.now()
      };

      // 1. Optimistically draw on chunk
      chunkManager.setPixel(pixel, true);

      // 2. Play sound
      sound.playPixelPlaced();

      // 3. Broadcast to multiplayer
      multiplayerClientRef.current?.sendPixel(pixel);

      // 4. Update recent colors
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
        return [color, ...filtered].slice(0, 6);
      });

      // 5. Update user profile stats & level
      setProfile((prev) => {
        const placed = prev.pixelsPlaced + 1;
        const newLevel = Math.floor(placed / 15) + 1;
        return {
          ...prev,
          pixelsPlaced: placed,
          level: newLevel,
          favoriteColor: color
        };
      });

      // 6. Check achievements
      setAchievements((prev) =>
        prev.map((ach) => {
          if (ach.id === 'first_pixel' && !ach.unlocked) {
            sound.playFanfare();
            return { ...ach, progress: 1, unlocked: true };
          }
          if (ach.id === 'builder') {
            const nextProg = Math.min(ach.maxProgress, ach.progress + 1);
            const unlocked = nextProg >= ach.maxProgress;
            if (unlocked && !ach.unlocked) sound.playFanfare();
            return { ...ach, progress: nextProg, unlocked };
          }
          return ach;
        })
      );

      // 7. Reset Cooldown
      setCooldownRemaining(maxCooldown);

      // 8. Update inspector if open
      setInspectCoords({ x, y });
      setInspectedPixel(pixel);
    },
    [cooldownRemaining, profile.username, chunkManager, maxCooldown]
  );

  // Inspect Pixel Handler
  const handleInspectPixel = useCallback(
    (x: number, y: number) => {
      setInspectCoords({ x, y });
      const pixel = chunkManager.getPixel(x, y);
      setInspectedPixel(pixel);
    },
    [chunkManager]
  );

  // Teleport camera helper
  const handleJumpTo = useCallback((targetX: number, targetY: number, targetZoom = 6.0) => {
    setCamX(targetX);
    setCamY(targetY);
    setZoom(targetZoom);
    multiplayerClientRef.current?.alignBotsNear(targetX, targetY);
  }, []);

  // Home: World Center (Cyber Dragon)
  const handleHome = () => {
    handleJumpTo(5000, 5000, 6.0);
  };

  // Random Landmark teleportation
  const handleRandom = () => {
    const randomLandmark = LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)];
    handleJumpTo(randomLandmark.x, randomLandmark.y, 6.0);
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'p' || e.key === 'P') setSelectedTool('pencil');
      if (e.key === 'b' || e.key === 'B') setSelectedTool('brush');
      if (e.key === 'l' || e.key === 'L') setSelectedTool('line');
      if (e.key === 'r' || e.key === 'R') setSelectedTool('rect');
      if (e.key === 'e' || e.key === 'E') setSelectedTool('eraser');
      if (e.key === 'i' || e.key === 'I') setSelectedTool('picker');
      if (e.key === 'h' || e.key === 'H') handleHome();
      if (e.key === 'm' || e.key === 'M') handleToggleSound();
      if (e.key === '?') setIsShortcutsOpen(true);
      if (e.key === 'Escape') {
        setInspectCoords(null);
        setIsTrendingOpen(false);
        setIsProfileOpen(false);
        setIsShortcutsOpen(false);
        setIsActivityOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#111214] font-sans antialiased select-none text-[#E1E4EA]">
      {/* Intro Loading Screen */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

      {/* Primary Canvas Viewport (occupies 100% of background) */}
      <CanvasViewport
        chunkManager={chunkManager}
        camX={camX}
        camY={camY}
        zoom={zoom}
        onCameraChange={handleCameraChange}
        selectedColor={selectedColor}
        selectedTool={selectedTool}
        brushSize={brushSize}
        canDraw={cooldownRemaining <= 0}
        onDrawPixel={handleDrawPixel}
        onPickColor={(color) => {
          setSelectedColor(color);
          setSelectedTool('pencil');
        }}
        onInspectPixel={handleInspectPixel}
        remoteCursors={remoteCursors}
        onCursorMove={(x, y, isDrawing) => {
          multiplayerClientRef.current?.sendCursorMove(x, y, isDrawing);
        }}
      />

      {/* Top Bar Navigation & Info */}
      <TopBar
        x={camX}
        y={camY}
        zoom={zoom}
        onlineCount={onlineCount}
        status={networkStatus}
        soundEnabled={soundEnabled}
        username={profile.username}
        onToggleSound={handleToggleSound}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenTrending={() => setIsTrendingOpen(true)}
        onOpenActivity={() => setIsActivityOpen(!isActivityOpen)}
        activityCount={activities.length}
      />

      {/* Active World Event Notice Banner */}
      <EventBanner event={activeEvent} />

      {/* Contextual Pixel Inspector */}
      <PixelInspector
        inspectCoords={inspectCoords}
        pixel={inspectedPixel}
        onClose={() => setInspectCoords(null)}
        onPickColor={(color) => setSelectedColor(color)}
      />

      {/* Live Mini-Map */}
      <MiniMap
        camX={camX}
        camY={camY}
        zoom={zoom}
        viewportWidth={typeof window !== 'undefined' ? window.innerWidth : 1200}
        viewportHeight={typeof window !== 'undefined' ? window.innerHeight : 800}
        landmarks={LANDMARKS}
        onJumpTo={(x, y) => handleJumpTo(x, y, zoom)}
        onZoomIn={() => setZoom((z) => Math.min(32.0, z * 1.35))}
        onZoomOut={() => setZoom((z) => Math.max(0.04, z * 0.7))}
        onHome={handleHome}
        onRandom={handleRandom}
      />

      {/* Bottom Drawing Palette & Cooldown Toolbar */}
      <BottomToolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        recentColors={recentColors}
        cooldownRemaining={cooldownRemaining}
        maxCooldown={maxCooldown}
        brushSize={brushSize}
        onSelectBrushSize={setBrushSize}
      />

      {/* Live Activity Feed Drawer */}
      <ActivityTicker
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activities={activities}
        onSendChat={(msg) => {
          multiplayerClientRef.current?.sendChat(msg, Math.round(camX), Math.round(camY));
        }}
        onJumpToCoords={(x, y) => handleJumpTo(x, y, 6.0)}
      />

      {/* Trending Landmarks Discovery Drawer */}
      <TrendingDrawer
        isOpen={isTrendingOpen}
        onClose={() => setIsTrendingOpen(false)}
        landmarks={LANDMARKS}
        onSelectLandmark={(lm) => handleJumpTo(lm.x, lm.y, 6.0)}
      />

      {/* Gamer Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        achievements={achievements}
        onUpdateUsername={(newName) => {
          setProfile((p) => ({ ...p, username: newName }));
          multiplayerClientRef.current?.updateUser(newName, profile.avatarColor);
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
