import React, { useState } from 'react';
import { Volume2, VolumeX, Keyboard, Compass, User, Flame, Activity, Share2, Check } from 'lucide-react';

interface TopBarProps {
  x: number;
  y: number;
  zoom: number;
  onlineCount: number;
  status: 'connected' | 'reconnecting' | 'offline';
  soundEnabled: boolean;
  username: string;
  onToggleSound: () => void;
  onOpenProfile: () => void;
  onOpenShortcuts: () => void;
  onOpenTrending: () => void;
  onOpenActivity: () => void;
  activityCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  x,
  y,
  zoom,
  onlineCount,
  status,
  soundEnabled,
  username,
  onToggleSound,
  onOpenProfile,
  onOpenShortcuts,
  onOpenTrending,
  onOpenActivity,
  activityCount
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-2 sm:p-3 flex items-center justify-between gap-2">
      {/* Left: Brand & Connection Status */}
      <div className="pointer-events-auto flex items-center gap-2 bg-[#17181B]/95 border border-[#272A30] px-2.5 py-1.5 rounded-lg shadow-sm backdrop-blur-xs">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-xs sm:text-sm text-white">
            <span className="w-2.5 h-2.5 bg-[#FF3B30] inline-block rounded-xs"></span>
            <span>PIXEL WORLD</span>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#2B2E36] text-[11px] font-mono">
            {status === 'connected' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
                <span className="text-[#34C759] font-medium hidden sm:inline">LIVE</span>
              </>
            ) : status === 'reconnecting' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] animate-ping"></span>
                <span className="text-[#FF9500] font-medium">RECONNECTING...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]"></span>
                <span className="text-[#FF3B30] font-medium">OFFLINE</span>
              </>
            )}
          </div>
        </div>

        {/* World Trending Button */}
        <button
          id="topbar-trending-btn"
          onClick={onOpenTrending}
          className="ml-1 text-[11px] px-2 py-0.5 rounded bg-[#202227] hover:bg-[#2A2D34] text-neutral-300 hover:text-white flex items-center gap-1 border border-neutral-700/50 transition-colors"
          title="Explore famous landmarks & trending art"
        >
          <Compass className="w-3.5 h-3.5 text-[#FF9500]" />
          <span className="hidden sm:inline">Discover</span>
        </button>

        <button
          id="topbar-activity-btn"
          onClick={onOpenActivity}
          className="relative text-[11px] px-2 py-0.5 rounded bg-[#202227] hover:bg-[#2A2D34] text-neutral-300 hover:text-white flex items-center gap-1 border border-neutral-700/50 transition-colors"
          title="Live activity stream"
        >
          <Activity className="w-3.5 h-3.5 text-[#00C7BE]" />
          <span className="hidden md:inline">Feed</span>
          {activityCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C7BE]"></span>
          )}
        </button>
      </div>

      {/* Center: Live Coordinates & Zoom Indicator */}
      <div className="pointer-events-auto bg-[#17181B]/95 border border-[#272A30] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-3 font-mono text-xs text-neutral-200">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">POS</span>
          <span className="text-white font-medium">
            X:{Math.round(x)} <span className="text-neutral-600">|</span> Y:{Math.round(y)}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 border-l border-[#2B2E36] pl-3 text-neutral-400">
          <span className="text-neutral-500">SCALE</span>
          <span className="text-neutral-200">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Right: Online counter, Share, Sound toggle, Hotkeys, Profile */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-[#17181B]/95 border border-[#272A30] px-2.5 py-1.5 rounded-lg shadow-sm">
        {/* Real Online Count */}
        <div
          className="flex items-center gap-1.5 pr-2 border-r border-[#2B2E36] font-mono text-xs"
          title={`Real active players currently connected: ${onlineCount}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
          <span className="text-neutral-200 font-medium">
            {onlineCount.toLocaleString()}
          </span>
          <span className="text-neutral-500 text-[10px] hidden md:inline">ONLINE</span>
        </div>

        {/* Share / Open 2nd tab button */}
        <button
          id="topbar-share-btn"
          onClick={handleShare}
          className="p-1.5 rounded hover:bg-[#252830] text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono"
          title="Copy link to invite a friend or test in 2nd tab"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#34C759]" />
              <span className="text-[#34C759] text-[10px] hidden lg:inline">COPIED!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-neutral-300" />
              <span className="text-neutral-400 text-[10px] hidden lg:inline">SHARE</span>
            </>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          id="topbar-sound-btn"
          onClick={onToggleSound}
          className="p-1.5 rounded hover:bg-[#252830] text-neutral-400 hover:text-white transition-colors"
          title={soundEnabled ? 'Mute Sound (M)' : 'Unmute Sound (M)'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-neutral-300" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
        </button>

        {/* Shortcuts */}
        <button
          id="topbar-shortcuts-btn"
          onClick={onOpenShortcuts}
          className="hidden sm:flex p-1.5 rounded hover:bg-[#252830] text-neutral-400 hover:text-white transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* User Profile Button */}
        <button
          id="topbar-profile-btn"
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 pl-1.5 py-0.5 pr-2 rounded bg-[#22252C] hover:bg-[#2B2E37] text-white text-xs font-medium border border-neutral-700/60 transition-colors"
        >
          <div className="w-5 h-5 rounded bg-[#FF3B30] flex items-center justify-center text-[10px] font-bold text-white uppercase">
            {username.charAt(0)}
          </div>
          <span className="hidden sm:inline text-neutral-200 font-mono text-[11px]">
            {username}
          </span>
        </button>
      </div>
    </header>
  );
};
