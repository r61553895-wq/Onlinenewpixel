import React, { useEffect, useState } from 'react';
import { Zap, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import { WorldEvent } from '../types';

interface EventBannerProps {
  event: WorldEvent | null;
  onJoinEvent?: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({ event, onJoinEvent }) => {
  const [timeLeft, setTimeLeft] = useState<string>('15:00');

  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((event.endsAt - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (!event) return null;

  return (
    <div className="absolute top-14 sm:top-14 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto select-none animate-in slide-in-from-top-3 duration-300">
      <div className="flex items-center gap-2.5 bg-[#17181B]/95 border border-[#FF9500]/40 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-xs font-mono text-xs">
        <div className="flex items-center gap-1.5 text-[#FF9500]">
          <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
          <span className="font-bold tracking-wider">{event.title}</span>
        </div>

        <span className="text-neutral-500">•</span>

        <span className="text-neutral-300 text-[11px] font-sans hidden md:inline">
          {event.bonusText}
        </span>

        <span className="text-neutral-500 hidden md:inline">•</span>

        <span className="bg-[#26282E] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
          {timeLeft}
        </span>
      </div>
    </div>
  );
};
