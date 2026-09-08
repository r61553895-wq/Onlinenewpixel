import React, { useState } from 'react';
import { 
  Pencil, 
  Brush, 
  Minus, 
  Square, 
  Eraser, 
  Pipette, 
  Zap, 
  Palette as PaletteIcon,
  Check
} from 'lucide-react';
import { DEFAULT_PALETTE, ToolType } from '../types';

interface BottomToolbarProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  recentColors: string[];
  cooldownRemaining: number; // in seconds, 0 = ready
  maxCooldown: number;
  brushSize: number;
  onSelectBrushSize: (size: number) => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  selectedTool,
  onSelectTool,
  selectedColor,
  onSelectColor,
  recentColors,
  cooldownRemaining,
  maxCooldown,
  brushSize,
  onSelectBrushSize
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const isReady = cooldownRemaining <= 0;
  const progressPercent = maxCooldown > 0 ? ((maxCooldown - cooldownRemaining) / maxCooldown) * 100 : 100;

  const tools: Array<{ type: ToolType; label: string; shortcut: string; icon: React.ReactNode }> = [
    { type: 'pencil', label: 'Pencil', shortcut: 'P', icon: <Pencil className="w-4 h-4" /> },
    { type: 'brush', label: 'Brush', shortcut: 'B', icon: <Brush className="w-4 h-4" /> },
    { type: 'line', label: 'Line', shortcut: 'L', icon: <Minus className="w-4 h-4" /> },
    { type: 'rect', label: 'Rectangle', shortcut: 'R', icon: <Square className="w-4 h-4" /> },
    { type: 'eraser', label: 'Eraser', shortcut: 'E', icon: <Eraser className="w-4 h-4" /> },
    { type: 'picker', label: 'Eyedropper', shortcut: 'I', icon: <Pipette className="w-4 h-4" /> }
  ];

  return (
    <footer className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none p-2 sm:p-3 flex flex-col items-center gap-2">
      {/* Palette & Controls Container */}
      <div className="pointer-events-auto flex flex-col sm:flex-row items-center gap-2 bg-[#17181B]/95 border border-[#272A30] p-2 rounded-xl shadow-2xl max-w-full overflow-x-auto">
        
        {/* Color Palette Swatches */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[85vw] sm:max-w-none pb-1 sm:pb-0">
          {/* Swatches Grid */}
          <div className="grid grid-flow-col grid-rows-2 sm:grid-rows-2 gap-1">
            {DEFAULT_PALETTE.map((color) => {
              const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  id={`swatch-${color.replace('#', '')}`}
                  onClick={() => onSelectColor(color)}
                  className={`w-6 h-6 rounded-xs transition-transform relative flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color}`}
                >
                  {isSelected && (
                    <Check className={`w-3.5 h-3.5 ${color === '#FFFFFF' || color === '#F6E05E' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Color Picker / Current Color */}
          <div className="flex flex-col items-center justify-center pl-1 border-l border-[#272A30] gap-1">
            <label 
              htmlFor="custom-color-input"
              className="w-7 h-7 rounded-xs border border-[#3E424B] cursor-pointer flex items-center justify-center relative transition-transform hover:scale-105"
              style={{ backgroundColor: selectedColor }}
              title="Custom Color"
            >
              <input
                id="custom-color-input"
                type="color"
                value={selectedColor}
                onChange={(e) => onSelectColor(e.target.value)}
                className="opacity-0 w-0 h-0 absolute pointer-events-none"
              />
              <PaletteIcon className={`w-3.5 h-3.5 ${selectedColor === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
            </label>
            <span className="font-mono text-[9px] text-neutral-400">
              {selectedColor.toUpperCase()}
            </span>
          </div>

          {/* Recently Used Colors */}
          {recentColors.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 border-l border-[#272A30] pl-2">
              <span className="text-[9px] font-mono text-neutral-500 uppercase">Recent</span>
              <div className="flex items-center gap-0.5">
                {recentColors.slice(0, 4).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectColor(c)}
                    className="w-4 h-4 rounded-xs border border-[#272A30] hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block h-9 w-px bg-[#272A30]" />

        {/* Tool Selector */}
        <div className="flex items-center gap-1">
          {tools.map((t) => {
            const isActive = selectedTool === t.type;
            return (
              <button
                key={t.type}
                id={`tool-${t.type}`}
                onClick={() => onSelectTool(t.type)}
                className={`p-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#2B2E37] text-white border border-neutral-600 shadow-inner'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#202227]'
                }`}
                title={`${t.label} (${t.shortcut})`}
              >
                {t.icon}
              </button>
            );
          })}

          {/* Brush Size Toggle (if Brush is selected) */}
          {selectedTool === 'brush' && (
            <div className="flex items-center gap-0.5 bg-[#202227] p-0.5 rounded border border-[#2B2E36] ml-1">
              {[1, 2, 3].map((size) => (
                <button
                  key={size}
                  onClick={() => onSelectBrushSize(size)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                    brushSize === size ? 'bg-[#34C759] text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {size}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block h-9 w-px bg-[#272A30]" />

        {/* Cooldown / Status Indicator */}
        <div className="flex items-center gap-2 pl-1">
          {isReady ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C2C23] border border-[#2E5E3E] text-[#34C759] font-mono text-xs font-bold tracking-wider animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>READY</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#202227] border border-[#2B2E36] font-mono text-xs">
              {/* Circular mini progress */}
              <div className="relative w-4 h-4 flex items-center justify-center">
                <svg className="w-4 h-4 transform -rotate-90">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="#3E424B"
                    strokeWidth="2"
                    fill="transparent"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="#FF9500"
                    strokeWidth="2"
                    fill="transparent"
                    strokeDasharray={37.7}
                    strokeDashoffset={37.7 - (37.7 * progressPercent) / 100}
                    className="transition-all duration-200"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-sans uppercase">Cooldown</span>
                <span className="text-[#FF9500] font-bold">
                  {cooldownRemaining.toFixed(1)}s
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </footer>
  );
};
