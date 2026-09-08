import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChunkManager } from '../utils/chunkManager';
import { PlayerCursor, ToolType, WORLD_SIZE, CHUNK_SIZE } from '../types';
import { sound } from '../utils/audio';

interface CanvasViewportProps {
  chunkManager: ChunkManager;
  camX: number;
  camY: number;
  zoom: number;
  onCameraChange: (x: number, y: number, zoom: number) => void;
  selectedColor: string;
  selectedTool: ToolType;
  brushSize: number;
  canDraw: boolean;
  onDrawPixel: (x: number, y: number, color: string) => void;
  onPickColor: (color: string) => void;
  onInspectPixel: (x: number, y: number) => void;
  remoteCursors: PlayerCursor[];
  onCursorMove: (x: number, y: number, isDrawing: boolean) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  chunkManager,
  camX,
  camY,
  zoom,
  onCameraChange,
  selectedColor,
  selectedTool,
  brushSize,
  canDraw,
  onDrawPixel,
  onPickColor,
  onInspectPixel,
  remoteCursors,
  onCursorMove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction states
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{ author?: string; text: string } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; camStartX: number; camStartY: number }>({ x: 0, y: 0, camStartX: 0, camStartY: 0 });
  const touchDistRef = useRef<number | null>(null);
  const spacePressedRef = useRef(false);
  const isDrawingStrokeRef = useRef(false);
  const strokeStartCellRef = useRef<{ x: number; y: number } | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  // Smooth camera interpolation targets
  const targetCamRef = useRef({ x: camX, y: camY, zoom: zoom });
  const currentCamRef = useRef({ x: camX, y: camY, zoom: zoom });

  // Sync external camera updates (e.g. from minimap or discovery drawer)
  useEffect(() => {
    targetCamRef.current = { x: camX, y: camY, zoom: zoom };
  }, [camX, camY, zoom]);

  // Convert screen coordinates to world pixel cell
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const { x: curX, y: curY, zoom: curZoom } = currentCamRef.current;

    const worldX = (screenX - width / 2) / curZoom + curX;
    const worldY = (screenY - height / 2) / curZoom + curY;

    return {
      x: Math.floor(worldX),
      y: Math.floor(worldY)
    };
  }, []);

  // Main Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Smooth camera interpolation (ease towards target)
      const target = targetCamRef.current;
      const current = currentCamRef.current;
      const ease = 0.22;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      current.zoom += (target.zoom - current.zoom) * ease;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas Background (Dark neutral game board)
      ctx.fillStyle = '#111214';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Setup World Transform: center on screen and scale
      ctx.translate(width / 2, height / 2);
      ctx.scale(current.zoom, current.zoom);
      ctx.translate(-current.x, -current.y);

      // Disable image smoothing for sharp pixels
      ctx.imageSmoothingEnabled = false;

      // World Boundary Border (10,000 x 10,000)
      ctx.strokeStyle = '#272A30';
      ctx.lineWidth = 1 / current.zoom;
      ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      // Calculate visible world bounding box
      const halfVisibleW = (width / 2) / current.zoom;
      const halfVisibleH = (height / 2) / current.zoom;
      const minWorldX = current.x - halfVisibleW;
      const minWorldY = current.y - halfVisibleH;
      const maxWorldX = current.x + halfVisibleW;
      const maxWorldY = current.y + halfVisibleH;

      // Draw Visible Chunks
      const visibleChunks = chunkManager.getVisibleChunks(minWorldX, minWorldY, maxWorldX, maxWorldY);
      for (const chunk of visibleChunks) {
        ctx.drawImage(
          chunk.canvas,
          chunk.cx * CHUNK_SIZE,
          chunk.cy * CHUNK_SIZE,
          CHUNK_SIZE,
          CHUNK_SIZE
        );
      }

      // Draw Pixel Placement Micro-Animations (100-200ms flash)
      const activeAnims = chunkManager.getActiveAnimations();
      const now = performance.now();
      for (const anim of activeAnims) {
        const elapsed = now - anim.startTime;
        const progress = Math.min(1, elapsed / anim.duration);
        const alpha = (1 - progress) * 0.8;
        const expand = progress * 0.4;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(
          anim.x - expand,
          anim.y - expand,
          1 + expand * 2,
          1 + expand * 2
        );
      }

      // Draw Pixel Grid when zoomed in
      if (current.zoom >= 8) {
        const gridAlpha = Math.min(0.2, (current.zoom - 8) / 10 * 0.2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${gridAlpha})`;
        ctx.lineWidth = 0.5 / current.zoom;

        const startX = Math.max(0, Math.floor(minWorldX));
        const endX = Math.min(WORLD_SIZE, Math.ceil(maxWorldX));
        const startY = Math.max(0, Math.floor(minWorldY));
        const endY = Math.min(WORLD_SIZE, Math.ceil(maxWorldY));

        ctx.beginPath();
        for (let gx = startX; gx <= endX; gx++) {
          ctx.moveTo(gx, startY);
          ctx.lineTo(gx, endY);
        }
        for (let gy = startY; gy <= endY; gy++) {
          ctx.moveTo(startX, gy);
          ctx.lineTo(endX, gy);
        }
        ctx.stroke();
      }

      // Draw Hovered Cell Highlight & Line/Rect Preview
      if (hoveredCell && hoveredCell.x >= 0 && hoveredCell.x < WORLD_SIZE && hoveredCell.y >= 0 && hoveredCell.y < WORLD_SIZE) {
        const { x: hx, y: hy } = hoveredCell;

        // Preview Line / Rect tool stroke if dragging
        if (isDrawingStrokeRef.current && strokeStartCellRef.current) {
          const start = strokeStartCellRef.current;
          ctx.fillStyle = selectedColor;
          ctx.globalAlpha = 0.7;

          if (selectedTool === 'rect') {
            const rx = Math.min(start.x, hx);
            const ry = Math.min(start.y, hy);
            const rw = Math.abs(hx - start.x) + 1;
            const rh = Math.abs(hy - start.y) + 1;
            ctx.fillRect(rx, ry, rw, rh);
          } else if (selectedTool === 'line') {
            // Bresenham line preview
            let x0 = start.x;
            let y0 = start.y;
            const x1 = hx;
            const y1 = hy;
            const dx = Math.abs(x1 - x0);
            const dy = Math.abs(y1 - y0);
            const sx = x0 < x1 ? 1 : -1;
            const sy = y0 < y1 ? 1 : -1;
            let err = dx - dy;

            while (true) {
              ctx.fillRect(x0, y0, 1, 1);
              if (x0 === x1 && y0 === y1) break;
              const e2 = 2 * err;
              if (e2 > -dy) { err -= dy; x0 += sx; }
              if (e2 < dx) { err += dx; y0 += sy; }
            }
          }
          ctx.globalAlpha = 1.0;
        } else {
          // Normal Hover Box
          const size = selectedTool === 'brush' ? brushSize : 1;
          const offset = Math.floor(size / 2);
          const px = hx - offset;
          const py = hy - offset;

          // Fill preview
          ctx.fillStyle = selectedTool === 'eraser' ? '#FF3B30' : selectedColor;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(px, py, size, size);

          // Outline
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = Math.max(0.5, 1.2 / current.zoom);
          ctx.strokeRect(px, py, size, size);
        }
      }

      // Draw Remote Player Cursors
      for (const player of remoteCursors) {
        // Culling: only draw if within visible viewport
        if (player.x >= minWorldX - 10 && player.x <= maxWorldX + 10 && player.y >= minWorldY - 10 && player.y <= maxWorldY + 10) {
          ctx.save();
          ctx.translate(player.x, player.y);

          // Subtle cursor indicator
          ctx.fillStyle = player.color;
          const scale = player.isDrawing ? 1.3 : 1.0;

          // Pointer shape
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(6 * scale / current.zoom, 14 * scale / current.zoom);
          ctx.lineTo(2 * scale / current.zoom, 13 * scale / current.zoom);
          ctx.lineTo(0, 18 * scale / current.zoom);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 0.8 / current.zoom;
          ctx.stroke();

          // Player Name Tag
          if (current.zoom > 1.5) {
            ctx.fillStyle = '#17181B';
            ctx.font = `${Math.max(9, 11 / current.zoom)}px 'IBM Plex Mono', monospace`;
            const textWidth = ctx.measureText(player.name).width;
            const pad = 2 / current.zoom;

            ctx.fillRect(
              8 / current.zoom,
              -12 / current.zoom,
              textWidth + pad * 2,
              12 / current.zoom
            );

            ctx.fillStyle = '#E1E4EA';
            ctx.fillText(player.name, 8 / current.zoom + pad, -2 / current.zoom);
          }
          ctx.restore();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [chunkManager, selectedColor, selectedTool, brushSize, hoveredCell, remoteCursors]);

  // Resize canvas to match container exactly
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Navigation (WASD / Arrows / Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        spacePressedRef.current = true;
      }

      const panSpeed = 60 / currentCamRef.current.zoom;
      let dx = 0;
      let dy = 0;

      if (e.key === 'KeyW' || e.key === 'w' || e.key === 'ArrowUp') dy -= panSpeed;
      if (e.key === 'KeyS' || e.key === 's' || e.key === 'ArrowDown') dy += panSpeed;
      if (e.key === 'KeyA' || e.key === 'a' || e.key === 'ArrowLeft') dx -= panSpeed;
      if (e.key === 'KeyD' || e.key === 'd' || e.key === 'ArrowRight') dx += panSpeed;

      if (dx !== 0 || dy !== 0) {
        const nextX = Math.max(0, Math.min(WORLD_SIZE, targetCamRef.current.x + dx));
        const nextY = Math.max(0, Math.min(WORLD_SIZE, targetCamRef.current.y + dy));
        targetCamRef.current.x = nextX;
        targetCamRef.current.y = nextY;
        onCameraChange(nextX, nextY, targetCamRef.current.zoom);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onCameraChange]);

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;

    // Point in world under cursor before zoom
    const worldBefore = screenToWorld(mouseScreenX, mouseScreenY);

    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    const newZoom = Math.max(0.04, Math.min(32.0, targetCamRef.current.zoom * zoomFactor));

    // Shift camera so mouse point stays at same screen position
    const width = canvasRef.current!.width;
    const height = canvasRef.current!.height;
    const newCamX = worldBefore.x - (mouseScreenX - width / 2) / newZoom;
    const newCamY = worldBefore.y - (mouseScreenY - height / 2) / newZoom;

    targetCamRef.current.zoom = newZoom;
    targetCamRef.current.x = Math.max(0, Math.min(WORLD_SIZE, newCamX));
    targetCamRef.current.y = Math.max(0, Math.min(WORLD_SIZE, newCamY));

    onCameraChange(targetCamRef.current.x, targetCamRef.current.y, newZoom);
  };

  // Mouse Down (Drag or Draw)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || spacePressedRef.current || e.altKey) {
      // Middle click or Space+Click: Pan
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camStartX: targetCamRef.current.x,
        camStartY: targetCamRef.current.y
      };
      return;
    }

    if (e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cell = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

      if (e.shiftKey) {
        // Shift+Click: Contextual Inspect
        onInspectPixel(cell.x, cell.y);
        return;
      }

      if (selectedTool === 'picker') {
        const p = chunkManager.getPixel(cell.x, cell.y);
        if (p) {
          onPickColor(p.color);
          sound.playClick();
        }
        return;
      }

      // If line or rect tool, start stroke tracking
      if (selectedTool === 'line' || selectedTool === 'rect') {
        isDrawingStrokeRef.current = true;
        strokeStartCellRef.current = cell;
        return;
      }

      // Regular draw action
      if (canDraw) {
        executeDraw(cell.x, cell.y);
      } else {
        // Just inspect if cooldown active
        onInspectPixel(cell.x, cell.y);
      }

      // Also allow dragging with left mouse if user drags beyond threshold
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camStartX: targetCamRef.current.x,
        camStartY: targetCamRef.current.y
      };
    }
  };

  const executeDraw = (x: number, y: number) => {
    if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) return;

    if (selectedTool === 'pencil') {
      onDrawPixel(x, y, selectedColor);
    } else if (selectedTool === 'brush') {
      const size = brushSize;
      const offset = Math.floor(size / 2);
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          onDrawPixel(x - offset + dx, y - offset + dy, selectedColor);
        }
      }
    } else if (selectedTool === 'eraser') {
      onDrawPixel(x, y, '#111214');
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const cell = screenToWorld(screenX, screenY);

    setHoveredCell(cell);
    onCursorMove(cell.x, cell.y, isDrawingStrokeRef.current);

    // Delayed tooltip for cell
    if (tooltipTimeoutRef.current) {
      window.clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = window.setTimeout(() => {
      const p = chunkManager.getPixel(cell.x, cell.y);
      if (p) {
        setTooltipInfo({
          author: p.author,
          text: `${cell.x} : ${cell.y}`
        });
      } else {
        setTooltipInfo({
          text: `${cell.x} : ${cell.y}`
        });
      }
    }, 450);

    // Handle Pan Dragging
    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / currentCamRef.current.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / currentCamRef.current.zoom;

      // If dragged > 4 pixels, cancel stroke
      if (Math.hypot(dx, dy) > 4) {
        isDrawingStrokeRef.current = false;
      }

      const nextX = Math.max(0, Math.min(WORLD_SIZE, dragStartRef.current.camStartX - dx));
      const nextY = Math.max(0, Math.min(WORLD_SIZE, dragStartRef.current.camStartY - dy));

      targetCamRef.current.x = nextX;
      targetCamRef.current.y = nextY;
      onCameraChange(nextX, nextY, targetCamRef.current.zoom);
    }
  };

  // Mouse Up
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawingStrokeRef.current && strokeStartCellRef.current && hoveredCell && canDraw) {
      const start = strokeStartCellRef.current;
      const end = hoveredCell;

      if (selectedTool === 'rect') {
        const x0 = Math.min(start.x, end.x);
        const x1 = Math.max(start.x, end.x);
        const y0 = Math.min(start.y, end.y);
        const y1 = Math.max(start.y, end.y);

        for (let ry = y0; ry <= y1; ry++) {
          for (let rx = x0; rx <= x1; rx++) {
            onDrawPixel(rx, ry, selectedColor);
          }
        }
      } else if (selectedTool === 'line') {
        let x0 = start.x;
        let y0 = start.y;
        const x1 = end.x;
        const y1 = end.y;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
          onDrawPixel(x0, y0, selectedColor);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x0 += sx; }
          if (e2 < dx) { err += dx; y0 += sy; }
        }
      }
    }

    isDraggingRef.current = false;
    isDrawingStrokeRef.current = false;
    strokeStartCellRef.current = null;
  };

  // Touch Support (Pinch zoom & pan for mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        camStartX: targetCamRef.current.x,
        camStartY: targetCamRef.current.y
      };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const touch = e.touches[0];
      const dx = (touch.clientX - dragStartRef.current.x) / currentCamRef.current.zoom;
      const dy = (touch.clientY - dragStartRef.current.y) / currentCamRef.current.zoom;

      const nextX = Math.max(0, Math.min(WORLD_SIZE, dragStartRef.current.camStartX - dx));
      const nextY = Math.max(0, Math.min(WORLD_SIZE, dragStartRef.current.camStartY - dy));

      targetCamRef.current.x = nextX;
      targetCamRef.current.y = nextY;
      onCameraChange(nextX, nextY, targetCamRef.current.zoom);
    } else if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistRef.current;
      touchDistRef.current = dist;

      const newZoom = Math.max(0.04, Math.min(32.0, targetCamRef.current.zoom * factor));
      targetCamRef.current.zoom = newZoom;
      onCameraChange(targetCamRef.current.x, targetCamRef.current.y, newZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchDistRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-crosshair select-none bg-[#111214]"
    >
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block w-full h-full pixelated"
      />

      {/* Subtle coordinate & placement tooltip near cursor */}
      {hoveredCell && tooltipInfo && (
        <div
          className="absolute pointer-events-none z-10 px-2 py-0.5 rounded bg-[#17181B]/90 border border-[#272A30] font-mono text-[10px] text-neutral-300 shadow-md backdrop-blur-xs flex items-center gap-1.5"
          style={{
            left: 20,
            bottom: 80
          }}
        >
          <span className="w-1.5 h-1.5 rounded-xs bg-[#FF9500]" />
          <span>{tooltipInfo.text}</span>
          {tooltipInfo.author && (
            <span className="text-[#00C7BE] font-semibold border-l border-neutral-700 pl-1.5">
              {tooltipInfo.author}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
