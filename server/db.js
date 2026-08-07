import "dotenv/config";
import mysql from "mysql2/promise";
import pg from "pg";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";

// هل نستخدم PostgreSQL؟ (تحدده DATABASE_URL — postgres:// على Render)
export const isPg = /^postgres/.test(process.env.DATABASE_URL || "");

// إرجاع التواريخ كنصوص بنفس صيغة MySQL (YYYY-MM-DD HH:MM:SS)
pg.types.setTypeParser(1082, (v) => v); // DATE
pg.types.setTypeParser(1114, (v) => v); // TIMESTAMP بدون منطقة زمنية
pg.types.setTypeParser(1184, (v) => v); // TIMESTAMPTZ

let _pool = null;
let _db = null;

export async function getPool() {
  if (!_pool && process.env.DATABASE_URL) {
    if (isPg) {
      _pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    } else {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        multipleStatements: true,
        dateStrings: true,
      });
    }
  }
  return _pool;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    const pool = await getPool();
    _db = isPg ? drizzlePg(pool, { schema, mode: "default" }) : drizzleMysql(pool, { schema, mode: "default" });
  }
  return _db;
}

// إدراج سطر وإرجاع رقمه (يعمل على المحركين)
export async function insertReturnId(tx, table, values) {
  if (isPg) {
    const [row] = await tx.insert(table).values(values).returning({ id: table.id });
    return row.id;
  }
  const result = await tx.insert(table).values(values);
  return result[0].insertId;
}

// إنشاء الجداول تلقائياً عند أول تشغيل (IF NOT EXISTS)
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
  await pool.query(isPg ? SCHEMA_SQL_PG : SCHEMA_SQL);
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
  if (isPg) {
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
  const [title, themeRaw, labelsRaw, logoBrand, logoBg] = await Promise.all([
    getSetting("title"),
    getSetting("theme"),
    getSetting("labels"),
    getSetting("logo_brand"),
    getSetting("logo_bg"),
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
    logos: { brand: logoBrand || "", bg: logoBg || "" },
  };
}

export async function saveAppSettings({ title, theme, labels, logos } = {}) {
  if (title !== undefined) await setSetting("title", title);
  if (theme !== undefined) await setSetting("theme", JSON.stringify(theme));
  if (labels !== undefined) await setSetting("labels", JSON.stringify(labels));
  if (logos !== undefined) {
    if (logos.brand !== undefined) await setSetting("logo_brand", logos.brand);
    if (logos.bg !== undefined) await setSetting("logo_bg", logos.bg);
  }
}
