import Database from 'better-sqlite3';
import path from 'path';

let db;

export function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'travel.db');
    db = new Database(dbPath);
    
    // Create Tables if not exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT DEFAULT '',
        profile_pic TEXT DEFAULT '🧑'
      );
      
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id)
      );
    `);
  }
  
  // Try to migrate existing DB
  try {
    db.exec("ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ''");
  } catch(e) { /* Column might already exist */ }
  
  try {
    db.exec("ALTER TABLE users ADD COLUMN profile_pic TEXT DEFAULT '🧑'");
  } catch(e) { /* Column might already exist */ }

  try {
    db.exec("ALTER TABLE users ADD COLUMN custom_api_key TEXT DEFAULT ''");
  } catch(e) { /* Column might already exist */ }

  try {
    db.exec("ALTER TABLE users ADD COLUMN custom_model TEXT DEFAULT ''");
  } catch(e) { /* Column might already exist */ }

  return db;
}
