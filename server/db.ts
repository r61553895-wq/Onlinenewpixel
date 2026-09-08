import fs from 'fs';
import path from 'path';
// Use node's built-in SQLite (available in Node.js 22+)
// We use dynamic require or standard import
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';

export interface DbPixel {
  x: number;
  y: number;
  color: string;
  author: string;
  timestamp: number;
}

export interface DbMessage {
  id: number;
  author: string;
  text: string;
  x?: number | null;
  y?: number | null;
  timestamp: number;
}

export interface DbUser {
  id: string;
  username: string;
  pixels_placed: number;
  favorite_color?: string;
  last_seen: number;
}

class PixelDatabase {
  private db: any;
  private dbPath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'pixelworld.db');
    this.db = new DatabaseSync(this.dbPath);

    this.initSchema();
  }

  private initSchema() {
    // Enable WAL mode for high concurrency
    try {
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
    } catch {
      // pragma might be ignored in memory/certain drivers
    }

    // Pixels table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pixels (
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        color TEXT NOT NULL,
        author TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (x, y)
      );
    `);

    // Chat messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        x INTEGER,
        y INTEGER,
        timestamp INTEGER NOT NULL
      );
    `);

    // Users / Players table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        pixels_placed INTEGER DEFAULT 0,
        favorite_color TEXT,
        last_seen INTEGER NOT NULL
      );
    `);

    console.log(`[Database] SQLite initialized at ${this.dbPath}`);
  }

  // --- PIXELS ---
  public setPixel(x: number, y: number, color: string, author: string, timestamp: number): DbPixel {
    const stmt = this.db.prepare(`
      INSERT INTO pixels (x, y, color, author, timestamp)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(x, y) DO UPDATE SET
        color = excluded.color,
        author = excluded.author,
        timestamp = excluded.timestamp;
    `);
    stmt.run(x, y, color, author, timestamp);

    return { x, y, color, author, timestamp };
  }

  public getAllPixels(): DbPixel[] {
    const stmt = this.db.prepare(`
      SELECT x, y, color, author, timestamp FROM pixels ORDER BY timestamp ASC
    `);
    return stmt.all() as DbPixel[];
  }

  public getRecentPixels(limit = 100): DbPixel[] {
    const stmt = this.db.prepare(`
      SELECT x, y, color, author, timestamp FROM pixels ORDER BY timestamp DESC LIMIT ?
    `);
    return stmt.all(limit) as DbPixel[];
  }

  public getPixelCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM pixels');
    const res = stmt.get() as { count: number };
    return res?.count || 0;
  }

  // --- CHAT MESSAGES ---
  public addMessage(author: string, text: string, x?: number | null, y?: number | null): DbMessage {
    const timestamp = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO messages (author, text, x, y, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(author, text, x ?? null, y ?? null);
    const id = Number(result.lastInsertRowid);

    return { id, author, text, x, y, timestamp };
  }

  public getRecentMessages(limit = 40): DbMessage[] {
    const stmt = this.db.prepare(`
      SELECT id, author, text, x, y, timestamp FROM messages ORDER BY id DESC LIMIT ?
    `);
    const rows = stmt.all(limit) as DbMessage[];
    return rows.reverse(); // chronological order
  }

  // --- USERS ---
  public upsertUser(id: string, username: string, favoriteColor?: string): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, pixels_placed, favorite_color, last_seen)
      VALUES (?, ?, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        favorite_color = COALESCE(excluded.favorite_color, users.favorite_color),
        last_seen = excluded.last_seen;
    `);
    stmt.run(id, username, favoriteColor || null, now);
  }

  public incrementUserPixels(id: string): void {
    const stmt = this.db.prepare(`
      UPDATE users SET pixels_placed = pixels_placed + 1, last_seen = ? WHERE id = ?
    `);
    stmt.run(Date.now(), id);
  }

  public getUser(id: string): DbUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return (stmt.get(id) as DbUser) || null;
  }
}

export const db = new PixelDatabase();
