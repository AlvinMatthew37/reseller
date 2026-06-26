import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'

import { REQUIRED_TABLES, SCHEMA_VERSION, schemaStatements } from './schema.js'

export interface DatabaseBootstrapInfo {
  databasePath: string
  schemaVersion: number
  tables: string[]
  isReady: boolean
}

let database: Database.Database | null = null
let activeDatabasePath = ''

function ensureParentDirectory(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function listExistingTables(db: Database.Database) {
  return db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `,
    )
    .all() as { name: string }[]
}


function ensureMenuItemDescriptionColumn(db: Database.Database) {
  const columns = db
    .prepare(
      `
        PRAGMA table_info(menu_items)
      `,
    )
    .all() as { name: string }[]

  if (!columns.some((column) => column.name === 'description')) {
    db.exec(`ALTER TABLE menu_items ADD COLUMN description TEXT NOT NULL DEFAULT ''`)
  }
}

function upsertSchemaVersion(db: Database.Database) {
  db.prepare(
    `
      INSERT INTO app_meta (key, value)
      VALUES ('schema_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
  ).run(String(SCHEMA_VERSION))
}

export function initializeDatabase(databasePath: string): Database.Database {
  if (database) {
    return database
  }

  ensureParentDirectory(databasePath)

  const db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  for (const statement of schemaStatements) {
    db.exec(statement)
  }

  ensureMenuItemDescriptionColumn(db)
  upsertSchemaVersion(db)

  database = db
  activeDatabasePath = databasePath

  return db
}

export function getDatabase(): Database.Database {
  if (!database) {
    throw new Error('Database has not been initialized yet.')
  }

  return database
}

export function getDatabaseBootstrapInfo(): DatabaseBootstrapInfo {
  const db = getDatabase()
  const tables = listExistingTables(db).map((table) => table.name)

  return {
    databasePath: activeDatabasePath,
    schemaVersion: SCHEMA_VERSION,
    tables,
    isReady: REQUIRED_TABLES.every((tableName) => tables.includes(tableName)),
  }
}
