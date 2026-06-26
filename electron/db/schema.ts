export const SCHEMA_VERSION = 1

export const REQUIRED_TABLES = [
  'app_meta',
  'vendors',
  'menu_items',
  'schedule_days',
  'scheduled_vendors',
] as const

export const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'cooldown')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image_path TEXT,
      status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS schedule_days (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      general_note TEXT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS scheduled_vendors (
      id TEXT PRIMARY KEY,
      schedule_day_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      vendor_note TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (schedule_day_id) REFERENCES schedule_days(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      UNIQUE (schedule_day_id, vendor_id)
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_menu_items_vendor_id ON menu_items(vendor_id);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_schedule_days_date ON schedule_days(date);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_scheduled_vendors_day_id ON scheduled_vendors(schedule_day_id);
  `,
] as const
