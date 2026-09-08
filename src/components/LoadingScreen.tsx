import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [pixelsActive, setPixelsActive] = useState<number>(0);
  const [fading, setFading] = useState(false);

  // 12 pixel blocks that assemble the mini pixel logo
  const TOTAL_PIXELS = 16;

  useEffect(() => {
    const timer = setInterval(() => {
      setPixelsActive((prev) => {
        if (prev >= TOTAL_PIXELS) {
          clearInterval(timer);
          setTimeout(() => setFading(true), 300);
          setTimeout(onComplete, 700);
          return prev;
        }
        return prev + 1;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#111214] flex flex-col items-center justify-center select-none transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Pixel logo grid */}
        <div className="grid grid-cols-4 gap-1.5 p-3 bg-[#17181B] border border-[#272A30] rounded-lg shadow-xl">
          {Array.from({ length: TOTAL_PIXELS }).map((_, i) => {
            const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#007AFF', '#AF52DE'];
            const color = colors[i % colors.length];
            const isVisible = i < pixelsActive;
            return (
              <div
                key={i}
                className="w-4 h-4 rounded-xs transition-all duration-150 transform"
                style={{
                  backgroundColor: isVisible ? color : '#23262D',
                  transform: isVisible ? 'scale(1)' : 'scale(0.4)',
                  opacity: isVisible ? 1 : 0.2
                }}
              />
            );
          })}
        </div>

        {/* Title & Status */}
        <div className="flex flex-col items-center gap-1.5 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-xs bg-[#FF3B30] inline-block" />
            <span className="font-bold text-base tracking-widest text-white">PIXEL WORLD</span>
          </div>
          <span className="text-xs text-neutral-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
            Connecting to global canvas (10,000 × 10,000)...
          </span>
        </div>
      </div>
    </div>
  );
};
