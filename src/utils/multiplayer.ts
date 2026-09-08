import { ActivityItem, Pixel, PlayerCursor, WorldEvent, WORLD_SIZE } from '../types';
import { sound } from './audio';

export interface MultiplayerCallbacks {
  onPixelPlaced: (pixel: Pixel, isRemote: boolean) => void;
  onCursorUpdate: (cursors: PlayerCursor[]) => void;
  onOnlineCount: (count: number) => void;
  onActivity: (activity: ActivityItem) => void;
  onStatusChange: (status: 'connected' | 'reconnecting' | 'offline') => void;
  onEventChange: (event: WorldEvent) => void;
  onInitialPixelsLoaded?: (pixels: Pixel[]) => void;
}

export class MultiplayerClient {
  private callbacks: MultiplayerCallbacks;
  private ws: WebSocket | null = null;
  private broadcast: BroadcastChannel | null = null;
  private localPlayerId: string;
  private localPlayerName: string;
  private localPlayerColor: string;
  private onlineCount: number = 1;
  private isDestroyed: boolean = false;
  private status: 'connected' | 'reconnecting' | 'offline' = 'reconnecting';
  private remotePlayers = new Map<string, PlayerCursor>();
  private reconnectTimer: any = null;
  private lastCursorSent = 0;

  private currentEvent: WorldEvent = {
    id: 'event_rush_1',
    title: 'PIXEL RUSH',
    description: 'Double placement speed across the entire canvas!',
    badge: 'SPEED x2',
    type: 'rush',
    bonusText: 'Cooldown reduced to 2.0s',
    endsAt: Date.now() + 25 * 60 * 1000
  };

  constructor(callbacks: MultiplayerCallbacks, playerName = 'You', playerColor = '#FF3B30') {
    this.callbacks = callbacks;
    this.localPlayerId = 'player_' + Math.random().toString(36).substring(2, 9);
    this.localPlayerName = playerName;
    this.localPlayerColor = playerColor;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcast = new BroadcastChannel('pixel_world_real_multiplayer_channel');
      this.broadcast.onmessage = this.handleBroadcastMessage.bind(this);
    }

    this.callbacks.onEventChange(this.currentEvent);
    this.initWebSocket();
  }

  private initWebSocket() {
    if (typeof window === 'undefined' || this.isDestroyed) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.callbacks.onStatusChange('connected');

        // Send handshake with real identity
        this.ws?.send(JSON.stringify({
          type: 'join',
          id: this.localPlayerId,
          name: this.localPlayerName,
          color: this.localPlayerColor
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'init:state') {
            // Initial synchronization from real SQLite database
            this.onlineCount = Math.max(1, data.online || 1);
            this.callbacks.onOnlineCount(this.onlineCount);

            // Populate all previously placed real pixels from SQLite
            if (Array.isArray(data.pixels) && data.pixels.length > 0) {
              if (this.callbacks.onInitialPixelsLoaded) {
                this.callbacks.onInitialPixelsLoaded(data.pixels);
              } else {
                for (const p of data.pixels) {
                  this.callbacks.onPixelPlaced(p, false);
                }
              }
            }

            // Populate existing other players
            if (Array.isArray(data.players)) {
              this.remotePlayers.clear();
              for (const p of data.players) {
                if (p.id !== this.localPlayerId) {
                  this.remotePlayers.set(p.id, {
                    id: p.id,
                    name: p.name || 'Player',
                    color: p.color || '#34C759',
                    x: p.x ?? 5000,
                    y: p.y ?? 5000,
                    lastActive: Date.now(),
                    isDrawing: Boolean(p.isDrawing)
                  });
                }
              }
              this.callbacks.onCursorUpdate(Array.from(this.remotePlayers.values()));
            }

            // Populate initial chat messages
            if (Array.isArray(data.messages)) {
              for (const m of data.messages) {
                this.callbacks.onActivity({
                  id: 'chat_' + m.id,
                  type: 'chat',
                  author: m.author.startsWith('@') ? m.author : `@${m.author}`,
                  text: m.text,
                  timestamp: m.timestamp,
                  coords: m.x != null && m.y != null ? { x: m.x, y: m.y } : undefined
                });
              }
            }
          } else if (data.type === 'online:count') {
            // Real online count update from server
            this.onlineCount = Math.max(1, data.count || 1);
            this.callbacks.onOnlineCount(this.onlineCount);
          } else if (data.type === 'pixel:placed') {
            // Real pixel placed by a player and stored in database
            const p = data.pixel;
            if (p) {
              this.callbacks.onPixelPlaced(p, true);
              sound.playRemotePixel();

              this.callbacks.onActivity({
                id: 'pixel_' + Date.now() + '_' + Math.random(),
                type: 'pixel',
                author: p.author.startsWith('@') ? p.author : `@${p.author}`,
                text: `placed a pixel at (${p.x}, ${p.y})`,
                timestamp: p.timestamp || Date.now(),
                coords: { x: p.x, y: p.y }
              });
            }
          } else if (data.type === 'cursor:moved') {
            // Real cursor movement from another player
            const c = data.cursor;
            if (c && c.id !== this.localPlayerId) {
              this.remotePlayers.set(c.id, {
                id: c.id,
                name: c.name || 'Player',
                color: c.color || '#00C7BE',
                x: c.x,
                y: c.y,
                lastActive: Date.now(),
                isDrawing: Boolean(c.isDrawing)
              });
              this.callbacks.onCursorUpdate(Array.from(this.remotePlayers.values()));
            }
          } else if (data.type === 'cursor:removed' || data.type === 'player:left') {
            // Another real player disconnected
            if (data.id && this.remotePlayers.has(data.id)) {
              this.remotePlayers.delete(data.id);
              this.callbacks.onCursorUpdate(Array.from(this.remotePlayers.values()));
            }
          } else if (data.type === 'player:joined') {
            // New player joined the session
            const p = data.player;
            if (p && p.id !== this.localPlayerId) {
              this.remotePlayers.set(p.id, {
                id: p.id,
                name: p.name || 'Player',
                color: p.color || '#00C7BE',
                x: p.x ?? 5000,
                y: p.y ?? 5000,
                lastActive: Date.now(),
                isDrawing: false
              });
              this.callbacks.onCursorUpdate(Array.from(this.remotePlayers.values()));
              this.callbacks.onActivity({
                id: 'join_' + Date.now(),
                type: 'chat',
                author: p.name.startsWith('@') ? p.name : `@${p.name}`,
                text: 'connected to the canvas',
                timestamp: Date.now(),
                coords: { x: p.x ?? 5000, y: p.y ?? 5000 }
              });
            }
          } else if (data.type === 'chat:message') {
            // Real chat message received from server
            const m = data.message;
            if (m) {
              this.callbacks.onActivity({
                id: 'chat_' + m.id,
                type: 'chat',
                author: m.author.startsWith('@') ? m.author : `@${m.author}`,
                text: m.text,
                timestamp: m.timestamp,
                coords: m.x != null && m.y != null ? { x: m.x, y: m.y } : undefined
              });
            }
          }
        } catch {
          // ignore invalid json
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.status = 'reconnecting';
          this.callbacks.onStatusChange('reconnecting');
          this.remotePlayers.clear();
          this.callbacks.onCursorUpdate([]);

          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (!this.isDestroyed) {
              this.initWebSocket();
            }
          }, 2000);
        }
      };

      this.ws.onerror = () => {
        // onclose will trigger reconnection
      };
    } catch {
      this.status = 'offline';
      this.callbacks.onStatusChange('offline');
    }
  }

  private handleBroadcastMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || data.senderId === this.localPlayerId) return;

    if (data.type === 'pixel:placed' && data.pixel) {
      this.callbacks.onPixelPlaced(data.pixel, true);
    }
  }

  public sendPixel(pixel: Pixel) {
    // Send over WebSocket to server (which persists to SQLite and broadcasts)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'pixel:place',
        pixel
      }));
    }

    // Also broadcast to local tabs
    if (this.broadcast) {
      this.broadcast.postMessage({
        type: 'pixel:placed',
        senderId: this.localPlayerId,
        pixel
      });
    }
  }

  public sendCursorMove(x: number, y: number, isDrawing = false) {
    const now = Date.now();
    // Throttle cursor packets to 45ms (approx 22fps network rate)
    if (now - this.lastCursorSent < 45) return;
    this.lastCursorSent = now;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'cursor:move',
        x,
        y,
        isDrawing
      }));
    }
  }

  public sendChat(text: string, x?: number, y?: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat:send',
        text,
        x,
        y
      }));
    }
  }

  public updateUser(name: string, color?: string) {
    this.localPlayerName = name;
    if (color) this.localPlayerColor = color;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'user:update',
        name,
        color
      }));
    }
  }

  // Not used in real online mode - kept for compatibility
  public alignBotsNear(_centerX: number, _centerY: number) {
    // No-op: Only real players exist!
  }

  public destroy() {
    this.isDestroyed = true;
    clearTimeout(this.reconnectTimer);
    if (this.broadcast) this.broadcast.close();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
