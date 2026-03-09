import { Database } from "bun:sqlite";

const db = new Database("chat-memo.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT,
    platform TEXT NOT NULL,
    created TEXT,
    messages TEXT NOT NULL,
    message_count INTEGER,
    imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, message_count, platform)
  )
`);

export interface Conversation {
  id?: number;
  title: string;
  url: string;
  platform: string;
  created: string;
  messages: string;
  imported_at?: string;
  messageCount?: number;
}

export function addConversation(conv: Conversation): number {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO conversations (title, url, platform, created, messages, message_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run([conv.title, conv.url, conv.platform, conv.created, conv.messages, conv.messageCount || 0]);
    return result.changes;
  } catch (e) {
    console.error("Error adding conversation:", conv.title, e);
    return 0;
  }
}

export function getAllConversations(): Conversation[] {
  const stmt = db.prepare("SELECT * FROM conversations ORDER BY created DESC");
  return stmt.all() as Conversation[];
}

export function searchConversations(keyword: string): Conversation[] {
  const stmt = db.prepare(`
    SELECT * FROM conversations 
    WHERE title LIKE ? OR messages LIKE ?
    ORDER BY created DESC
  `);
  return stmt.all([`%${keyword}%`, `%${keyword}%`]) as Conversation[];
}

export function deleteConversation(id: number): void {
  const stmt = db.prepare("DELETE FROM conversations WHERE id = ?");
  stmt.run(id);
}

export function getStats() {
  const total = db.prepare("SELECT COUNT(*) as count FROM conversations").get() as { count: number };
  const byPlatform = db.prepare(`
    SELECT platform, COUNT(*) as count 
    FROM conversations 
    GROUP BY platform
  `).all();
  return { total: total.count, byPlatform };
}

export function clearAll() {
  db.exec("DELETE FROM conversations");
}
