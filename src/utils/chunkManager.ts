import { CHUNK_SIZE, Pixel, WORLD_SIZE } from '../types';

export interface Chunk {
  cx: number;
  cy: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  pixels: Map<number, Pixel>; // index = (y % CHUNK_SIZE) * CHUNK_SIZE + (x % CHUNK_SIZE)
  lastModified: number;
}

export interface PixelAnimation {
  x: number;
  y: number;
  color: string;
  startTime: number;
  duration: number; // 150-200ms
}

export class ChunkManager {
  private chunks = new Map<string, Chunk>();
  private activeAnimations: PixelAnimation[] = [];

  private getChunkKey(cx: number, cy: number): string {
    return `${cx}_${cy}`;
  }

  public getOrCreateChunk(cx: number, cy: number): Chunk {
    const key = this.getChunkKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const canvas = document.createElement('canvas');
      canvas.width = CHUNK_SIZE;
      canvas.height = CHUNK_SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.imageSmoothingEnabled = false;

      chunk = {
        cx,
        cy,
        canvas,
        ctx,
        pixels: new Map(),
        lastModified: Date.now()
      };
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  public setPixel(pixel: Pixel, triggerAnimation = true): void {
    if (pixel.x < 0 || pixel.x >= WORLD_SIZE || pixel.y < 0 || pixel.y >= WORLD_SIZE) {
      return;
    }

    const cx = Math.floor(pixel.x / CHUNK_SIZE);
    const cy = Math.floor(pixel.y / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(cx, cy);

    const localX = pixel.x - cx * CHUNK_SIZE;
    const localY = pixel.y - cy * CHUNK_SIZE;
    const pixelIndex = localY * CHUNK_SIZE + localX;

    chunk.ctx.fillStyle = pixel.color;
    chunk.ctx.fillRect(localX, localY, 1, 1);
    chunk.pixels.set(pixelIndex, pixel);
    chunk.lastModified = Date.now();

    if (triggerAnimation) {
      this.activeAnimations.push({
        x: pixel.x,
        y: pixel.y,
        color: pixel.color,
        startTime: performance.now(),
        duration: 180
      });
    }
  }

  public setPixelsBatch(pixels: Pixel[], triggerAnimation = false): void {
    for (const p of pixels) {
      this.setPixel(p, triggerAnimation);
    }
  }

  public getPixel(x: number, y: number): Pixel | null {
    if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) return null;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const key = this.getChunkKey(cx, cy);
    const chunk = this.chunks.get(key);
    if (!chunk) return null;

    const localX = x - cx * CHUNK_SIZE;
    const localY = y - cy * CHUNK_SIZE;
    const index = localY * CHUNK_SIZE + localX;
    return chunk.pixels.get(index) || null;
  }

  public getVisibleChunks(
    worldMinX: number,
    worldMinY: number,
    worldMaxX: number,
    worldMaxY: number
  ): Chunk[] {
    const minCx = Math.max(0, Math.floor(worldMinX / CHUNK_SIZE));
    const maxCx = Math.min(Math.floor(WORLD_SIZE / CHUNK_SIZE), Math.floor(worldMaxX / CHUNK_SIZE));
    const minCy = Math.max(0, Math.floor(worldMinY / CHUNK_SIZE));
    const maxCy = Math.min(Math.floor(WORLD_SIZE / CHUNK_SIZE), Math.floor(worldMaxY / CHUNK_SIZE));

    const result: Chunk[] = [];
    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const key = this.getChunkKey(cx, cy);
        const chunk = this.chunks.get(key);
        if (chunk) {
          result.push(chunk);
        }
      }
    }
    return result;
  }

  public getActiveAnimations(): PixelAnimation[] {
    const now = performance.now();
    this.activeAnimations = this.activeAnimations.filter(
      anim => now - anim.startTime < anim.duration
    );
    return this.activeAnimations;
  }

  public getLoadedChunksCount(): number {
    return this.chunks.size;
  }

  public getTotalPlacedPixels(): number {
    let count = 0;
    for (const chunk of this.chunks.values()) {
      count += chunk.pixels.size;
    }
    return count;
  }
}
