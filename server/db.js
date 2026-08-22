import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import mysql from "mysql2/promise";
import pg from "pg";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { eq, getTableName } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";

// هل نستخدم PostgreSQL؟ (יי DATABASE_URL — postgres:// على Render)
const dbUrl = process.env.DATABASE_URL || "";
export const isPg = /^postgres/.test(dbUrl);
export const isSqlite = !dbUrl || /^sqlite/.test(dbUrl);

// إرجاع التواريخ كنصوص بنفس صيغة MySQL (YYYY-MM-DD HH:MM:SS)
if (isPg) {
  pg.types.setTypeParser(1082, (v) => v); // DATE
  pg.types.setTypeParser(1114, (v) => v); // TIMESTAMP بدون منطقة زمنية
  pg.types.setTypeParser(1184, (v) => v); // TIMESTAMPTZ
}

let _pool = null;
let _db = null;

export async function getPool() {
  if (!_pool) {
    if (isSqlite) {
      const sqlite = new Database("./local.db");
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");
      _pool = sqlite;
    } else if (isPg) {
      _pool = new pg.Pool({ connectionString: dbUrl });
    } else {
      _pool = mysql.createPool({
        uri: dbUrl,
        multipleStatements: true,
        dateStrings: true,
      });
    }
  }
  return _pool;
}

export async function getDb() {
  if (!_db) {
    const pool = await getPool();
    if (isSqlite) {
      _db = drizzleSqlite(pool, { schema });
    } else if (isPg) {
      _db = drizzlePg(pool, { schema, mode: "default" });
    } else {
      _db = drizzleMysql(pool, { schema, mode: "default" });
    }
  }
  return _db;
}

// إدراج سطر وإرجاع رقمه (يعمل على المحركين)
export async function insertReturnId(tx, table, values) {
  if (isSqlite) {
    await tx.insert(table).values(values);
    const pool = await getPool();
    const row = pool.prepare("SELECT last_insert_rowid() AS id").get();
    return Number(row.id);
  }
  if (isPg) {
    const [row] = await tx.insert(table).values(values).returning({ id: table.id });
    return row.id;
  }
  const result = await tx.insert(table).values(values);
  return result[0].insertId;
}

// إنشاء الجداول تلقائياً عند أول تشغيل (IF NOT EXISTS)
// نسخة SQLite (تشغيل محلي بدون قاعدة بيانات)
const SCHEMA_SQLITE = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_id TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  login_method TEXT,
  last_signed_in TEXT,
  role TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS penalty_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date TEXT NOT NULL,
  shift_id INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS report_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  inspection_item_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (inspection_item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS penalties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  penalty_type_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  note TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (penalty_type_id) REFERENCES penalty_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  report_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
`;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  login_method VARCHAR(50),
  last_signed_in DATETIME,
  role VARCHAR(20) DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inspection_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(64),
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_item_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS penalty_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_date DATE NOT NULL,
  shift_id INT,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS report_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  inspection_item_id INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  CONSTRAINT fk_ri_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_ri_item FOREIGN KEY (inspection_item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS penalties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  penalty_type_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  note VARCHAR(500),
  CONSTRAINT fk_penalty_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_penalty_type FOREIGN KEY (penalty_type_id) REFERENCES penalty_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  \`key\` VARCHAR(100) NOT NULL UNIQUE,
  value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  report_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// نسخة PostgreSQL (تشغيل على Render)
export const SCHEMA_SQL_PG = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  login_method VARCHAR(50),
  last_signed_in TIMESTAMP,
  role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(64),
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT fk_item_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS penalty_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  shift_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS report_items (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL,
  inspection_item_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  CONSTRAINT fk_ri_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_ri_item FOREIGN KEY (inspection_item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS penalties (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL,
  penalty_type_id INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  note VARCHAR(500),
  CONSTRAINT fk_penalty_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_penalty_type FOREIGN KEY (penalty_type_id) REFERENCES penalty_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  report_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
`;

export async function initSchema() {
  const pool = await getPool();
  if (!pool) return;
  if (isSqlite) {
    pool.exec(SCHEMA_SQLITE);
    await migrateSchema(pool);
    return;
  }
  await pool.query(isPg ? SCHEMA_SQL_PG : SCHEMA_SQL);
  await migrateSchema(pool);
}

async function migrateSchema(pool) {
  try {
    if (isSqlite) {
      // SQLite: check if icon column exists
      const info = pool.prepare(`PRAGMA table_info(inspection_items)`).all();
      if (!info.some((c) => c.name === "icon")) {
        pool.exec(`ALTER TABLE inspection_items ADD COLUMN icon VARCHAR(64)`);
      }
    } else if (isPg) {
      await pool.query(`ALTER TABLE inspection_items ADD COLUMN IF NOT EXISTS icon VARCHAR(64)`);
    } else {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspection_items' AND COLUMN_NAME = 'icon'`
      );
      if (Number(rows?.[0]?.n || 0) === 0) {
        await pool.query(`ALTER TABLE inspection_items ADD COLUMN icon VARCHAR(64)`);
      }
    }
  } catch (e) {
    console.error("[Database] تعذر تحديث مخطط قاعدة البيانات:", e.message);
  }
}

// ===== قراءة / كتابة الإعدادات =====
export async function getSetting(key, defaultValue = null) {
  const db = await getDb();
  if (!db) return defaultValue;
  const rows = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1);
  return rows.length > 0 ? rows[0].value : defaultValue;
}

export async function setSetting(key, value) {
  const db = await getDb();
  if (!db) return;
  if (isSqlite) {
    const pool = await getPool();
    const existing = pool.prepare(`SELECT id FROM settings WHERE key = ?`).get(key);
    if (existing) {
      pool.prepare(`UPDATE settings SET value = ? WHERE key = ?`).run(value, key);
    } else {
      pool.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`).run(key, value);
    }
  } else if (isPg) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  } else {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  }
}

// ===== إعدادات التطبيق =====
export async function getAppSettings() {
  const [title, themeRaw, labelsRaw, logoBrand, logoBg, logoIcon] = await Promise.all([
    getSetting("title"),
    getSetting("theme"),
    getSetting("labels"),
    getSetting("logo_brand"),
    getSetting("logo_bg"),
    getSetting("logo_icon"),
  ]);
  let theme = null;
  let labels = null;
  if (themeRaw) {
    try {
      theme = JSON.parse(themeRaw);
    } catch {
      theme = null;
    }
  }
  if (labelsRaw) {
    try {
      labels = JSON.parse(labelsRaw);
    } catch {
      labels = null;
    }
  }
  return {
    title: title || null,
    theme,
    labels,
    logos: { brand: logoBrand || "", bg: logoBg || "", icon: logoIcon || "" },
  };
}

export async function saveAppSettings({ title, theme, labels, logos } = {}) {
  if (title !== undefined) await setSetting("title", title);
  if (theme !== undefined) await setSetting("theme", JSON.stringify(theme));
  if (labels !== undefined) await setSetting("labels", JSON.stringify(labels));
  if (logos !== undefined) {
    if (logos.brand !== undefined) await setSetting("logo_brand", logos.brand);
    if (logos.bg !== undefined) await setSetting("logo_bg", logos.bg);
    if (logos.icon !== undefined) await setSetting("logo_icon", logos.icon);
  }
}
