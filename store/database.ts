import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitializing: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // If already initializing, wait for that to complete
  if (dbInitializing) return dbInitializing;

  // If we have a db, verify it is still usable
  if (db) {
    try {
      await db.getFirstAsync('SELECT 1');
      return db;
    } catch (e) {
      // Stale/closed native connection — discard and re-open
      db = null;
    }
  }

  dbInitializing = (async () => {
    try {
      const newDb = await SQLite.openDatabaseAsync('realestate.db');
      await initSchema(newDb);
      db = newDb;
      return db;
    } finally {
      dbInitializing = null;
    }
  })();

  return dbInitializing;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Properties synced from the cloud bridge
    CREATE TABLE IF NOT EXISTS properties (
      id              INTEGER PRIMARY KEY,
      owner_name      TEXT,
      mobile_number   TEXT,
      address         TEXT,
      city            TEXT,
      area_marla      REAL,
      area_sqft       REAL,
      plot_length     REAL,
      plot_width      REAL,
      property_type   TEXT DEFAULT 'Residential',
      property_subtype TEXT,
      purpose         TEXT DEFAULT 'sale',
      beds            INTEGER DEFAULT 0,
      baths           INTEGER DEFAULT 0,
      kitchens        INTEGER DEFAULT 0,
      parking         INTEGER DEFAULT 0,
      furnished       TEXT,
      rent_monthly    REAL,
      security_deposit REAL,
      installments_available INTEGER DEFAULT 0,
      demand          REAL,
      demand_currency TEXT DEFAULT 'PKR',
      status          TEXT DEFAULT 'Available',
      notes           TEXT,
      agent_name      TEXT,
      agent_mobile    TEXT,
      images          TEXT DEFAULT '[]',
      video_url       TEXT,
      created_at      TEXT,
      updated_at      TEXT,
      synced_at       TEXT
    );

    -- Pending submissions created by this agent on mobile
    -- Queued locally when offline, pushed to bridge when online
    CREATE TABLE IF NOT EXISTS pending_submissions (
      local_id        INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id   TEXT UNIQUE,
      owner_name      TEXT NOT NULL,
      mobile_number   TEXT,
      address         TEXT,
      city            TEXT,
      area_marla      REAL,
      area_sqft       REAL,
      plot_length     REAL,
      plot_width      REAL,
      property_type   TEXT DEFAULT 'Residential',
      property_subtype TEXT,
      purpose         TEXT DEFAULT 'sale',
      beds            INTEGER DEFAULT 0,
      baths           INTEGER DEFAULT 0,
      kitchens        INTEGER DEFAULT 0,
      parking         INTEGER DEFAULT 0,
      furnished       TEXT,
      rent_monthly    REAL,
      security_deposit REAL,
      installments_available INTEGER DEFAULT 0,
      demand          REAL,
      demand_currency TEXT DEFAULT 'PKR',
      notes           TEXT,
      status          TEXT DEFAULT 'queued',
      push_status     TEXT DEFAULT 'pending',
      images          TEXT DEFAULT '[]',
      created_at      TEXT DEFAULT (datetime('now'))
    );

    -- Tracks last sync time so we only request updates
    CREATE TABLE IF NOT EXISTS sync_meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Columns are now natively included in CREATE TABLE above.
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
