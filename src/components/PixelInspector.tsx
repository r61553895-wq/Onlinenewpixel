import React from 'react';
import { X, Copy, Check, Pipette } from 'lucide-react';
import { Pixel } from '../types';

interface PixelInspectorProps {
  pixel: Pixel | null;
  inspectCoords: { x: number; y: number } | null;
  onClose: () => void;
  onPickColor: (color: string) => void;
}

export const PixelInspector: React.FC<PixelInspectorProps> = ({
  pixel,
  inspectCoords,
  onClose,
  onPickColor
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!inspectCoords) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${inspectCoords.x}, ${inspectCoords.y}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const timeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="absolute right-3 top-16 z-20 w-64 bg-[#17181B]/95 border border-[#272A30] rounded-xl shadow-2xl p-3 text-xs font-mono select-none animate-in fade-in slide-in-from-right-4 duration-200 backdrop-blur-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#26282E]">
        <div className="flex items-center gap-1.5 font-bold text-white tracking-wider">
          <span className="w-2 h-2 rounded-xs bg-[#FF3B30]" />
          <span>INSPECT PIXEL</span>
        </div>
        <button
          id="pixel-inspector-close"
          onClick={onClose}
          className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid coordinates */}
      <div className="flex items-center justify-between py-1 text-neutral-300">
        <span className="text-neutral-500">COORDINATES</span>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-bold">
            {inspectCoords.x} : {inspectCoords.y}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white"
            title="Copy Coordinates"
          >
            {copied ? <Check className="w-3 h-3 text-[#34C759]" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Pixel Color */}
      <div className="flex items-center justify-between py-1 text-neutral-300">
        <span className="text-neutral-500">COLOR</span>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-xs border border-white/20 shadow-xs"
            style={{ backgroundColor: pixel ? pixel.color : '#111214' }}
          />
          <span className="text-neutral-200">
            {pixel ? pixel.color.toUpperCase() : 'EMPTY'}
          </span>
          {pixel && (
            <button
              onClick={() => onPickColor(pixel.color)}
              className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white"
              title="Pick this color"
            >
              <Pipette className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Author & Timestamp if placed */}
      {pixel ? (
        <>
          <div className="flex items-center justify-between py-1 text-neutral-300">
            <span className="text-neutral-500">PLACED BY</span>
            <span className="text-[#30B0C7] font-semibold">{pixel.author}</span>
          </div>

          <div className="flex items-center justify-between py-1 text-neutral-300">
            <span className="text-neutral-500">TIMESTAMP</span>
            <span className="text-neutral-400">{timeAgo(pixel.timestamp)}</span>
          </div>
        </>
      ) : (
        <div className="py-2 mt-1 text-center bg-[#111214] rounded border border-dashed border-[#26282E] text-neutral-500 text-[11px]">
          EMPTY CELL<br />
          <span className="text-neutral-400">Click to place your pixel</span>
        </div>
      )}
    </div>
  );
};
