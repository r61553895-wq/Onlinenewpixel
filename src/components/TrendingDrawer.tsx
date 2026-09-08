import React from 'react';
import { X, Flame, MapPin, Users, ArrowUpRight } from 'lucide-react';
import { Landmark } from '../types';

interface TrendingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  landmarks: Landmark[];
  onSelectLandmark: (landmark: Landmark) => void;
}

export const TrendingDrawer: React.FC<TrendingDrawerProps> = ({
  isOpen,
  onClose,
  landmarks,
  onSelectLandmark
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#17181B] border border-[#272A30] w-full max-w-md rounded-xl shadow-2xl p-4 flex flex-col gap-3 font-sans animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#272A30]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF9500]" />
            <span className="font-bold text-white text-sm tracking-wide">TRENDING LANDMARKS</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-400">
          Select a featured community landmark to teleport your camera directly to the active canvas region:
        </p>

        {/* Landmarks list */}
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {landmarks.map((lm) => (
            <div
              key={lm.id}
              onClick={() => {
                onSelectLandmark(lm);
                onClose();
              }}
              className="p-2.5 rounded-lg bg-[#202227] hover:bg-[#262A32] border border-[#2B2E37] hover:border-[#3D424F] cursor-pointer transition-all flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl pt-0.5">{lm.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-xs group-hover:text-[#FF9500] transition-colors">
                      {lm.name}
                    </h4>
                    <span className="font-mono text-[10px] text-neutral-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {lm.x}:{lm.y}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                    {lm.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#34C759]" />
                      {lm.pixelsCount.toLocaleString()} pixels
                    </span>
                    {lm.tags.map(t => (
                      <span key={t} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#17181B] text-neutral-400 border border-neutral-700/50">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-1 rounded bg-[#17181B] group-hover:bg-[#FF9500] group-hover:text-black text-neutral-400 transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
