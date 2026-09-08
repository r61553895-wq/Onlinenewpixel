import React, { useState } from 'react';
import { X, MessageSquare, Send, Sparkles, MapPin } from 'lucide-react';
import { ActivityItem } from '../types';

interface ActivityTickerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
  onSendChat: (message: string) => void;
  onJumpToCoords?: (x: number, y: number) => void;
}

export const ActivityTicker: React.FC<ActivityTickerProps> = ({
  isOpen,
  onClose,
  activities,
  onSendChat,
  onJumpToCoords
}) => {
  const [chatText, setChatText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatText.trim()) {
      onSendChat(chatText.trim());
      setChatText('');
    }
  };

  const timeAgo = (timestamp: number) => {
    const s = Math.floor((Date.now() - timestamp) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  };

  return (
    <div className="absolute left-3 top-16 z-30 w-72 bg-[#17181B]/95 border border-[#272A30] rounded-xl shadow-2xl p-3 flex flex-col gap-2 font-mono text-xs select-none backdrop-blur-xs animate-in slide-in-from-left-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#26282E]">
        <div className="flex items-center gap-1.5 font-bold text-white tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#00C7BE]" />
          <span>WORLD FEED & CHAT</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Feed list */}
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {activities.slice(0, 20).map((act) => (
          <div
            key={act.id}
            className="p-1.5 rounded bg-[#202227] border border-[#2B2E37] flex flex-col gap-0.5"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-[#00C7BE]">{act.author}</span>
              <span className="text-neutral-500">{timeAgo(act.timestamp)}</span>
            </div>
            <div className="text-[11px] text-neutral-300 font-sans break-words flex items-center justify-between gap-1">
              <span>{act.text}</span>
              {act.coords && onJumpToCoords && (
                <button
                  onClick={() => onJumpToCoords(act.coords!.x, act.coords!.y)}
                  className="shrink-0 p-0.5 rounded hover:bg-[#2C303A] text-neutral-400 hover:text-white"
                  title="Jump to location"
                >
                  <MapPin className="w-3 h-3 text-[#FF9500]" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick message input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1 mt-1 pt-2 border-t border-[#26282E]">
        <input
          type="text"
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          placeholder="Type message to world..."
          maxLength={80}
          className="flex-1 bg-[#111214] border border-[#2B2E37] rounded px-2 py-1 text-[11px] text-white focus:outline-hidden"
        />
        <button
          type="submit"
          className="p-1.5 rounded bg-[#00C7BE] hover:bg-[#28D4CC] text-black transition-colors"
          title="Send"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
