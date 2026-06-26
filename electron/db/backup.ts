import fs from 'node:fs'
import path from 'node:path'

import { dialog, type BrowserWindow } from 'electron'

import { getMenuImagesDirectory, writeImportedMenuImage } from '../files/menu-images.js'
import { getDatabase } from './client.js'

type BackupVendorRow = {
  id: string
  name: string
  type: string
  location: string
  phone_number: string
  status: string
  created_at: string
  updated_at: string
}

type BackupMenuImage = {
  fileName: string
  mimeType: string
  base64: string
}

type BackupMenuItemRow = {
  id: string
  vendor_id: string
  name: string
  price: number
  image_path: string | null
  image: BackupMenuImage | null
  status: string
  created_at: string
  updated_at: string
}

type BackupScheduleDayRow = {
  id: string
  date: string
  general_note: string | null
}

type BackupScheduledVendorRow = {
  id: string
  schedule_day_id: string
  vendor_id: string
  vendor_note: string | null
  sort_order: number
}

type BackupAppMetaRow = {
  key: string
  value: string
}

type BackupPayload = {
  version: number
  exportedAt: string
  appMeta: BackupAppMetaRow[]
  vendors: BackupVendorRow[]
  menuItems: BackupMenuItemRow[]
  scheduleDays: BackupScheduleDayRow[]
  scheduledVendors: BackupScheduledVendorRow[]
}

type BackupOperationResult = {
  filePath: string
  counts: {
    vendors: number
    menuItems: number
    scheduleDays: number
    scheduledVendors: number
  }
}

type BackupRestoreResult = BackupOperationResult & {
  importedAt: string
}

const BACKUP_VERSION = 1

function assertBrowserWindow(browserWindow: BrowserWindow | null): BrowserWindow {
  if (!browserWindow) {
    throw new Error('The application window is not available.')
  }

  return browserWindow
}

function toLocalDateText(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getBackupDefaultName(prefix: string, extension: string) {
  return `reseller-${prefix}-${toLocalDateText(new Date())}.${extension}`
}

function getMimeType(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

function csvEscape(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function createCsvLine(values: Array<string | number | null | undefined>) {
  return values.map(csvEscape).join(',')
}

function readTextFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8')
}

function writeTextFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function readJsonBackup(filePath: string): BackupPayload {
  const rawText = readTextFile(filePath)
  const parsed = JSON.parse(rawText) as Partial<BackupPayload>

  if (!parsed || parsed.version !== BACKUP_VERSION) {
    throw new Error('This backup file is not compatible with the current app version.')
  }

  if (
    !Array.isArray(parsed.vendors) ||
    !Array.isArray(parsed.menuItems) ||
    !Array.isArray(parsed.scheduleDays) ||
    !Array.isArray(parsed.scheduledVendors) ||
    !Array.isArray(parsed.appMeta)
  ) {
    throw new Error('The backup file is missing one or more required data sections.')
  }

  return parsed as BackupPayload
}

function getBackupPayload(): BackupPayload {
  const db = getDatabase()

  const vendors = db
    .prepare(
      `
        SELECT id, name, type, location, phone_number, status, created_at, updated_at
        FROM vendors
        ORDER BY name COLLATE NOCASE ASC
      `,
    )
    .all() as BackupVendorRow[]

  const rawMenuItems = db
    .prepare(
      `
        SELECT id, vendor_id, name, price, image_path, status, created_at, updated_at
        FROM menu_items
        ORDER BY created_at ASC
      `,
    )
    .all() as Omit<BackupMenuItemRow, 'image'>[]

  const menuItems = rawMenuItems.map((row) => {
    if (!row.image_path || !fs.existsSync(row.image_path)) {
      return {
        ...row,
        image: null,
      }
    }

    const fileName = path.basename(row.image_path)

    return {
      ...row,
      image: {
        fileName,
        mimeType: getMimeType(fileName),
        base64: fs.readFileSync(row.image_path).toString('base64'),
      },
    }
  })

  const scheduleDays = db
    .prepare(
      `
        SELECT id, date, general_note
        FROM schedule_days
        ORDER BY date ASC
      `,
    )
    .all() as BackupScheduleDayRow[]

  const scheduledVendors = db
    .prepare(
      `
        SELECT id, schedule_day_id, vendor_id, vendor_note, sort_order
        FROM scheduled_vendors
        ORDER BY schedule_day_id ASC, sort_order ASC
      `,
    )
    .all() as BackupScheduledVendorRow[]

  const appMeta = db
    .prepare(
      `
        SELECT key, value
        FROM app_meta
        ORDER BY key ASC
      `,
    )
    .all() as BackupAppMetaRow[]

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appMeta,
    vendors,
    menuItems,
    scheduleDays,
    scheduledVendors,
  }
}

function restoreBackupPayload(payload: BackupPayload) {
  const db = getDatabase()

  db.transaction(() => {
    db.prepare('DELETE FROM scheduled_vendors').run()
    db.prepare('DELETE FROM menu_items').run()
    db.prepare('DELETE FROM schedule_days').run()
    db.prepare('DELETE FROM vendors').run()
    db.prepare('DELETE FROM app_meta').run()

    for (const metaRow of payload.appMeta) {
      db.prepare(
        `
          INSERT INTO app_meta (key, value)
          VALUES (?, ?)
        `,
      ).run(metaRow.key, metaRow.value)
    }

    for (const vendor of payload.vendors) {
      db.prepare(
        `
          INSERT INTO vendors (id, name, type, location, phone_number, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        vendor.id,
        vendor.name,
        vendor.type,
        vendor.location,
        vendor.phone_number,
        vendor.status,
        vendor.created_at,
        vendor.updated_at,
      )
    }

    for (const scheduleDay of payload.scheduleDays) {
      db.prepare(
        `
          INSERT INTO schedule_days (id, date, general_note)
          VALUES (?, ?, ?)
        `,
      ).run(scheduleDay.id, scheduleDay.date, scheduleDay.general_note)
    }

    for (const menuItem of payload.menuItems) {
      let importedImagePath: string | null = null

      if (menuItem.image && menuItem.image.base64) {
        importedImagePath = writeImportedMenuImage(menuItem.image.fileName, menuItem.image.base64)
      }

      db.prepare(
        `
          INSERT INTO menu_items (id, vendor_id, name, price, image_path, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        menuItem.id,
        menuItem.vendor_id,
        menuItem.name,
        menuItem.price,
        importedImagePath,
        menuItem.status,
        menuItem.created_at,
        menuItem.updated_at,
      )
    }

    for (const scheduledVendor of payload.scheduledVendors) {
      db.prepare(
        `
          INSERT INTO scheduled_vendors (id, schedule_day_id, vendor_id, vendor_note, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `,
      ).run(
        scheduledVendor.id,
        scheduledVendor.schedule_day_id,
        scheduledVendor.vendor_id,
        scheduledVendor.vendor_note,
        scheduledVendor.sort_order,
      )
    }
  })()
}

function getCounts(payload: BackupPayload) {
  return {
    vendors: payload.vendors.length,
    menuItems: payload.menuItems.length,
    scheduleDays: payload.scheduleDays.length,
    scheduledVendors: payload.scheduledVendors.length,
  }
}

export async function exportJsonBackup(browserWindow: BrowserWindow | null): Promise<BackupOperationResult | null> {
  const currentWindow = assertBrowserWindow(browserWindow)
  const payload = getBackupPayload()
  const result = await dialog.showSaveDialog(currentWindow, {
    title: 'Export Reseller backup',
    defaultPath: getBackupDefaultName('backup', 'json'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  writeTextFile(result.filePath, `${JSON.stringify(payload, null, 2)}\n`)

  return {
    filePath: result.filePath,
    counts: getCounts(payload),
  }
}

export async function importJsonBackup(browserWindow: BrowserWindow | null): Promise<BackupRestoreResult | null> {
  const currentWindow = assertBrowserWindow(browserWindow)
  const result = await dialog.showOpenDialog(currentWindow, {
    title: 'Import Reseller backup',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]
  const payload = readJsonBackup(filePath)
  const counts = getCounts(payload)

  restoreBackupPayload(payload)

  return {
    filePath,
    counts,
    importedAt: new Date().toISOString(),
  }
}

export async function exportVendorsCsv(browserWindow: BrowserWindow | null): Promise<BackupOperationResult | null> {
  const currentWindow = assertBrowserWindow(browserWindow)
  const db = getDatabase()
  const rows = db
    .prepare(
      `
        SELECT id, name, type, location, phone_number, status, created_at, updated_at
        FROM vendors
        ORDER BY name COLLATE NOCASE ASC
      `,
    )
    .all() as BackupVendorRow[]

  const result = await dialog.showSaveDialog(currentWindow, {
    title: 'Export vendors CSV',
    defaultPath: getBackupDefaultName('vendors', 'csv'),
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  const lines = [
    createCsvLine(['id', 'name', 'type', 'location', 'phone_number', 'status', 'created_at', 'updated_at']),
    ...rows.map((row) =>
      createCsvLine([
        row.id,
        row.name,
        row.type,
        row.location,
        row.phone_number,
        row.status,
        row.created_at,
        row.updated_at,
      ]),
    ),
  ]

  writeTextFile(result.filePath, `${lines.join('\n')}\n`)

  return {
    filePath: result.filePath,
    counts: {
      vendors: rows.length,
      menuItems: 0,
      scheduleDays: 0,
      scheduledVendors: 0,
    },
  }
}

export async function exportMenusCsv(browserWindow: BrowserWindow | null): Promise<BackupOperationResult | null> {
  const currentWindow = assertBrowserWindow(browserWindow)
  const db = getDatabase()
  const rows = db
    .prepare(
      `
        SELECT id, vendor_id, name, price, image_path, status, created_at, updated_at
        FROM menu_items
        ORDER BY created_at ASC
      `,
    )
    .all() as BackupMenuItemRow[]

  const result = await dialog.showSaveDialog(currentWindow, {
    title: 'Export menu items CSV',
    defaultPath: getBackupDefaultName('menu-items', 'csv'),
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  const lines = [
    createCsvLine([
      'id',
      'vendor_id',
      'name',
      'price',
      'image_path',
      'status',
      'created_at',
      'updated_at',
    ]),
    ...rows.map((row) =>
      createCsvLine([
        row.id,
        row.vendor_id,
        row.name,
        row.price,
        row.image_path,
        row.status,
        row.created_at,
        row.updated_at,
      ]),
    ),
  ]

  writeTextFile(result.filePath, `${lines.join('\n')}\n`)

  return {
    filePath: result.filePath,
    counts: {
      vendors: 0,
      menuItems: rows.length,
      scheduleDays: 0,
      scheduledVendors: 0,
    },
  }
}

export function getBackupImageDirectory() {
  return getMenuImagesDirectory()
}
