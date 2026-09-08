import React, { useRef, useState } from 'react';
import { Maximize2, Minimize2, Home, Shuffle, Plus, Minus } from 'lucide-react';
import { Landmark, WORLD_SIZE } from '../types';

interface MiniMapProps {
  camX: number;
  camY: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  landmarks: Landmark[];
  onJumpTo: (x: number, y: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onHome: () => void;
  onRandom: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  camX,
  camY,
  zoom,
  viewportWidth,
  viewportHeight,
  landmarks,
  onJumpTo,
  onZoomIn,
  onZoomOut,
  onHome,
  onRandom
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const MAP_SIZE = 148; // px

  // Calculate visible world boundaries in pixels
  const visibleWorldW = viewportWidth / zoom;
  const visibleWorldH = viewportHeight / zoom;

  const worldLeft = camX - visibleWorldW / 2;
  const worldTop = camY - visibleWorldH / 2;

  // Normalized to mini-map coordinates (0..MAP_SIZE)
  const viewX = Math.max(0, Math.min(MAP_SIZE, (worldLeft / WORLD_SIZE) * MAP_SIZE));
  const viewY = Math.max(0, Math.min(MAP_SIZE, (worldTop / WORLD_SIZE) * MAP_SIZE));
  const viewW = Math.max(4, Math.min(MAP_SIZE, (visibleWorldW / WORLD_SIZE) * MAP_SIZE));
  const viewH = Math.max(4, Math.min(MAP_SIZE, (visibleWorldH / WORLD_SIZE) * MAP_SIZE));

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = (clickX / MAP_SIZE) * WORLD_SIZE;
    const targetWorldY = (clickY / MAP_SIZE) * WORLD_SIZE;

    onJumpTo(
      Math.max(0, Math.min(WORLD_SIZE, targetWorldX)),
      Math.max(0, Math.min(WORLD_SIZE, targetWorldY))
    );
  };

  return (
    <div className="absolute right-2 sm:right-3 bottom-20 sm:bottom-24 z-20 flex flex-col items-end gap-1.5 select-none pointer-events-auto">
      {/* Mini-map Container */}
      {!isCollapsed && (
        <div className="bg-[#17181B]/95 border border-[#272A30] p-1.5 rounded-lg shadow-xl backdrop-blur-xs flex flex-col gap-1">
          <div className="flex items-center justify-between px-1 text-[10px] font-mono text-neutral-400">
            <span>WORLD MAP</span>
            <span className="text-neutral-500">10k × 10k</span>
          </div>

          {/* Map canvas area */}
          <div
            ref={mapRef}
            id="minimap-view"
            onClick={handleMapClick}
            className="relative bg-[#111214] rounded cursor-crosshair overflow-hidden border border-[#23262C]"
            style={{ width: MAP_SIZE, height: MAP_SIZE }}
          >
            {/* World grid line quadrants */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-20">
              <div className="border-r border-b border-neutral-600" />
              <div className="border-b border-neutral-600" />
              <div className="border-r border-neutral-600" />
              <div />
            </div>

            {/* Landmarks on minimap */}
            {landmarks.map((lm) => {
              const lx = (lm.x / WORLD_SIZE) * MAP_SIZE;
              const ly = (lm.y / WORLD_SIZE) * MAP_SIZE;
              return (
                <div
                  key={lm.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[10px]"
                  style={{ left: lx, top: ly }}
                  title={`${lm.name} (${lm.x}, ${lm.y})`}
                >
                  <span className="drop-shadow">{lm.icon}</span>
                </div>
              );
            })}

            {/* Current Viewport Box */}
            <div
              className="absolute border border-[#FF3B30] bg-[#FF3B30]/20 pointer-events-none transition-all duration-75"
              style={{
                left: viewX,
                top: viewY,
                width: viewW,
                height: viewH
              }}
            />

            {/* Player position point */}
            <div
              className="absolute w-1.5 h-1.5 rounded-full bg-white shadow pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: (camX / WORLD_SIZE) * MAP_SIZE,
                top: (camY / WORLD_SIZE) * MAP_SIZE
              }}
            />
          </div>
        </div>
      )}

      {/* Map Control Buttons */}
      <div className="flex items-center gap-1 bg-[#17181B]/95 border border-[#272A30] p-1 rounded-lg shadow-md">
        <button
          id="minimap-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded hover:bg-[#252830] text-neutral-300 hover:text-white transition-colors"
          title={isCollapsed ? 'Show Mini-Map' : 'Hide Mini-Map'}
        >
          {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          id="minimap-home-btn"
          onClick={onHome}
          className="p-1.5 rounded hover:bg-[#252830] text-neutral-300 hover:text-white transition-colors"
          title="Center of World (Home)"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        <button
          id="minimap-random-btn"
          onClick={onRandom}
          className="p-1.5 rounded hover:bg-[#252830] text-neutral-300 hover:text-white transition-colors"
          title="Random Landmark (Shuffle)"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[#2B2E36]" />

        <button
          id="minimap-zoomin-btn"
          onClick={onZoomIn}
          className="p-1.5 rounded hover:bg-[#252830] text-neutral-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          id="minimap-zoomout-btn"
          onClick={onZoomOut}
          className="p-1.5 rounded hover:bg-[#252830] text-neutral-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
