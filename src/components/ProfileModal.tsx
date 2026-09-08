import React, { useState } from 'react';
import { X, Award, Shield, Palette, Calendar, Map, CheckCircle2, Circle } from 'lucide-react';
import { Achievement, UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  achievements: Achievement[];
  onUpdateUsername: (name: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  achievements,
  onUpdateUsername
}) => {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.username);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateUsername(tempName.trim());
      setEditing(false);
    }
  };

  // Generate a mock contribution heat grid for the last 30 days
  const heatDays = Array.from({ length: 35 }, (_, i) => {
    const intensity = (i * 7 + 3) % 5; // 0..4
    return { day: i, intensity };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-[#17181B] border border-[#272A30] w-full max-w-lg rounded-xl shadow-2xl p-5 flex flex-col gap-4 font-sans animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#272A30]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white shadow-md border border-white/10"
              style={{ backgroundColor: profile.avatarColor || '#FF3B30' }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              {editing ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-[#111214] border border-[#3E424B] px-2 py-0.5 rounded text-white text-xs font-mono focus:outline-hidden"
                    maxLength={16}
                    autoFocus
                  />
                  <button type="submit" className="text-[11px] px-2 py-0.5 rounded bg-[#34C759] text-black font-bold">
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base font-mono">
                    {profile.username}
                  </h3>
                  <button
                    onClick={() => {
                      setTempName(profile.username);
                      setEditing(true);
                    }}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300 underline"
                  >
                    edit
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202227] text-[#FF9500] border border-[#30333D] flex items-center gap-1 font-semibold">
                  <Shield className="w-3 h-3" />
                  LEVEL {profile.level}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Active {profile.daysActive} days
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-[#202227] border border-[#2B2E37] flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Pixels Placed</span>
            <span className="text-sm font-mono font-bold text-white mt-1">
              {profile.pixelsPlaced.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#202227] border border-[#2B2E37] flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Fav Color</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-3.5 h-3.5 rounded-xs border border-white/20"
                style={{ backgroundColor: profile.favoriteColor }}
              />
              <span className="text-xs font-mono font-medium text-neutral-300">
                {profile.favoriteColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#202227] border border-[#2B2E37] flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Global Rank</span>
            <span className="text-sm font-mono font-bold text-[#00C7BE] mt-1">
              #428
            </span>
          </div>
        </div>

        {/* Contribution Activity Heatmap */}
        <div className="flex flex-col gap-1.5 bg-[#202227] p-3 rounded-lg border border-[#2B2E37]">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>ACTIVITY MAP (30 DAYS)</span>
            <span className="text-neutral-500 text-[10px]">Consistent Builder</span>
          </div>
          <div className="grid grid-flow-col grid-rows-5 gap-1 py-1">
            {heatDays.map((d) => {
              const colors = ['#17181B', '#1C3829', '#2E6941', '#42A864', '#5AE089'];
              return (
                <div
                  key={d.day}
                  className="w-3.5 h-3.5 rounded-xs"
                  style={{ backgroundColor: colors[d.intensity] }}
                  title={`Day ${d.day}: ${d.intensity * 12} pixels`}
                />
              );
            })}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#FFCC00]" />
              ACHIEVEMENTS ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-2 rounded-lg border flex items-start gap-2.5 ${
                  ach.unlocked
                    ? 'bg-[#202227] border-[#34C759]/40 text-neutral-200'
                    : 'bg-[#17181B] border-[#272A30] text-neutral-500 opacity-60'
                }`}
              >
                <div className="text-lg pt-0.5">{ach.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate">
                      {ach.title}
                    </span>
                    {ach.unlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
