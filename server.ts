import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { db, DbPixel } from './server/db.js';

interface ClientSession {
  ws: WebSocket;
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  isDrawing: boolean;
  lastPing: number;
}

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json());

// Track truly connected clients in memory
const clients = new Map<WebSocket, ClientSession>();

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    online: clients.size,
    totalPixels: db.getPixelCount(),
    time: Date.now()
  });
});

// Return real live stats (actual connected players and total pixels in SQLite)
app.get('/api/stats', (req, res) => {
  res.json({
    online: clients.size,
    totalPixels: db.getPixelCount(),
    activeEvent: {
      id: 'event_rush_1',
      title: 'PIXEL RUSH',
      badge: 'SPEED x2',
      cooldownMultiplier: 0.5
    }
  });
});

// Return all persisted pixels from SQLite database
app.get('/api/pixels', (req, res) => {
  const pixels = db.getAllPixels();
  res.json({ pixels, count: pixels.length });
});

// Return recent chat messages from SQLite database
app.get('/api/messages', (req, res) => {
  const messages = db.getRecentMessages(50);
  res.json({ messages });
});

// Optional REST endpoint to place pixel
app.post('/api/pixel', (req, res) => {
  const { x, y, color, author, userId } = req.body;
  if (typeof x !== 'number' || typeof y !== 'number' || !color) {
    return res.status(400).json({ error: 'Invalid pixel coordinates or color' });
  }

  const safeX = Math.floor(x);
  const safeY = Math.floor(y);
  if (safeX < 0 || safeX >= 10000 || safeY < 0 || safeY >= 10000) {
    return res.status(400).json({ error: 'Coordinates out of bounds (0-9999)' });
  }

  const safeAuthor = (author && String(author).trim().slice(0, 24)) || 'Anonymous';
  const safeColor = String(color).slice(0, 10);
  const timestamp = Date.now();

  const pixel = db.setPixel(safeX, safeY, safeColor, safeAuthor, timestamp);
  if (userId) {
    db.incrementUserPixels(String(userId));
  }

  // Broadcast to all WS clients
  broadcast({
    type: 'pixel:placed',
    pixel
  });

  res.json({ success: true, pixel });
});

// Broadcast helper
function broadcast(data: object, exclude?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [ws] of clients) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const session: ClientSession = {
    ws,
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name: 'Player',
    color: '#FF3B30',
    x: 5000,
    y: 5000,
    isDrawing: false,
    lastPing: Date.now()
  };

  clients.set(ws, session);

  // Send initial data state from real SQLite database
  const existingPixels = db.getAllPixels();
  const recentMessages = db.getRecentMessages(40);

  // Collect other currently active players
  const otherPlayers = Array.from(clients.values())
    .filter((c) => c.ws !== ws)
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      x: c.x,
      y: c.y,
      isDrawing: c.isDrawing
    }));

  ws.send(JSON.stringify({
    type: 'init:state',
    playerId: session.id,
    online: clients.size,
    pixels: existingPixels,
    messages: recentMessages,
    players: otherPlayers
  }));

  // Broadcast real updated online count to all clients
  broadcast({
    type: 'online:count',
    count: clients.size
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'join') {
        if (data.id) session.id = String(data.id);
        if (data.name) session.name = String(data.name).trim().slice(0, 20) || 'Player';
        if (data.color) session.color = String(data.color);

        db.upsertUser(session.id, session.name, session.color);

        // Notify others of joined player
        broadcast({
          type: 'player:joined',
          player: {
            id: session.id,
            name: session.name,
            color: session.color,
            x: session.x,
            y: session.y,
            isDrawing: session.isDrawing
          }
        }, ws);
      } else if (data.type === 'pixel:place' && data.pixel) {
        const p = data.pixel;
        const x = Math.floor(p.x);
        const y = Math.floor(p.y);

        if (x >= 0 && x < 10000 && y >= 0 && y < 10000 && p.color) {
          const author = (p.author && String(p.author).trim().slice(0, 24)) || session.name;
          const color = String(p.color).slice(0, 10);
          const timestamp = Date.now();

          // Save to SQLite
          const saved = db.setPixel(x, y, color, author, timestamp);
          db.incrementUserPixels(session.id);

          // Broadcast to everyone
          broadcast({
            type: 'pixel:placed',
            pixel: saved
          });
        }
      } else if (data.type === 'cursor:move') {
        session.x = Math.max(0, Math.min(9999, Math.floor(data.x ?? session.x)));
        session.y = Math.max(0, Math.min(9999, Math.floor(data.y ?? session.y)));
        session.isDrawing = Boolean(data.isDrawing);

        // Broadcast real cursor position to other connected players
        broadcast({
          type: 'cursor:moved',
          cursor: {
            id: session.id,
            name: session.name,
            color: session.color,
            x: session.x,
            y: session.y,
            isDrawing: session.isDrawing
          }
        }, ws);
      } else if (data.type === 'chat:send' && typeof data.text === 'string') {
        const text = data.text.trim().slice(0, 100);
        if (text.length > 0) {
          const x = typeof data.x === 'number' ? Math.floor(data.x) : null;
          const y = typeof data.y === 'number' ? Math.floor(data.y) : null;

          // Save to SQLite
          const savedMsg = db.addMessage(session.name, text, x, y);

          // Broadcast to everyone
          broadcast({
            type: 'chat:message',
            message: savedMsg
          });
        }
      } else if (data.type === 'user:update') {
        if (data.name) session.name = String(data.name).trim().slice(0, 20);
        if (data.color) session.color = String(data.color);
        db.upsertUser(session.id, session.name, session.color);

        broadcast({
          type: 'cursor:moved',
          cursor: {
            id: session.id,
            name: session.name,
            color: session.color,
            x: session.x,
            y: session.y,
            isDrawing: session.isDrawing
          }
        }, ws);
      }
    } catch {
      // Ignore invalid JSON payloads
    }
  });

  ws.on('close', () => {
    clients.delete(ws);

    // Notify others that this player left and remove their cursor
    broadcast({
      type: 'player:left',
      id: session.id
    });
    broadcast({
      type: 'cursor:removed',
      id: session.id
    });
    broadcast({
      type: 'online:count',
      count: clients.size
    });
  });

  ws.on('error', () => {
    clients.delete(ws);
    broadcast({
      type: 'online:count',
      count: clients.size
    });
  });
});

// Vite middleware / Static serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PIXEL WORLD] Server listening on http://0.0.0.0:${PORT} with real SQLite DB`);
  });
}

setupVite();

