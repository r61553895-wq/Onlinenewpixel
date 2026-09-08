import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'P', action: 'Pencil Tool' },
    { key: 'B', action: 'Brush (2x2 / 3x3)' },
    { key: 'L', action: 'Line Tool' },
    { key: 'R', action: 'Rectangle Tool' },
    { key: 'E', action: 'Eraser (Clear Pixel)' },
    { key: 'I', action: 'Eyedropper (Pick Color)' },
    { key: 'WASD / Arrows', action: 'Pan Camera' },
    { key: 'Space + Drag', action: 'Quick Pan' },
    { key: 'Scroll Wheel', action: 'Smooth Zoom' },
    { key: 'H', action: 'Home (World Center)' },
    { key: 'M', action: 'Toggle Sound' },
    { key: 'Esc', action: 'Close Panels' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#17181B] border border-[#272A30] w-full max-w-sm rounded-xl shadow-2xl p-4 flex flex-col gap-3 font-sans animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-[#272A30]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[#00C7BE]" />
            <span className="font-bold text-white text-sm tracking-wide">SHORTCUTS</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5 font-mono text-xs max-h-72 overflow-y-auto pr-1">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-1.5 rounded bg-[#202227] border border-[#2B2E37]"
            >
              <span className="text-neutral-300 font-sans text-[11px]">{s.action}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#111214] border border-neutral-700 text-neutral-300 font-semibold text-[10px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
