import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, ipcMain } from 'electron'

import { getDatabaseBootstrapInfo, initializeDatabase } from './db/client.js'
import {
  exportJsonBackup,
  exportMenusCsv,
  exportVendorsCsv,
  importJsonBackup,
} from './db/backup.js'
import {
  addVendorToDay,
  getScheduleRange,
  getWeekSchedule,
  removeVendorFromDay,
  updateScheduledVendorNote,
  upsertDayNote,
} from './db/schedule.js'
import { createMenuItem, listMenuItemsByVendor, setMenuItemStatus, updateMenuItem } from './db/menus.js'
import { createVendor, getVendorById, listVendors, setVendorStatus, updateVendor } from './db/vendors.js'
import { getMenuImagePreviewUrl, selectAndImportMenuImage } from './files/menu-images.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged
const devServerUrl = 'http://localhost:5173'
let mainWindow: BrowserWindow | null = null
let ipcHandlersRegistered = false

function getDatabasePath() {
  return path.join(app.getPath('userData'), 'reseller.sqlite')
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isDev) {
    await mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
}

function registerIpcHandlers() {
  if (ipcHandlersRegistered) {
    return
  }

  ipcHandlersRegistered = true

  ipcMain.handle('app:get-bootstrap-info', async () => getDatabaseBootstrapInfo())
  ipcMain.handle('menus:select-image', async () => selectAndImportMenuImage(mainWindow as BrowserWindow))
  ipcMain.handle('vendors:list', async () => listVendors())
  ipcMain.handle('vendors:get-by-id', async (_event, vendorId: string) => getVendorById(vendorId))
  ipcMain.handle('vendors:create', async (_event, input) => createVendor(input))
  ipcMain.handle('vendors:update', async (_event, vendorId: string, input) =>
    updateVendor(vendorId, input),
  )
  ipcMain.handle('vendors:set-status', async (_event, vendorId: string, status) =>
    setVendorStatus(vendorId, status),
  )
  ipcMain.handle('menus:list-by-vendor', async (_event, vendorId: string) =>
    listMenuItemsByVendor(vendorId),
  )
  ipcMain.handle('menus:create', async (_event, vendorId: string, input) =>
    createMenuItem(vendorId, input),
  )
  ipcMain.handle('menus:update', async (_event, menuItemId: string, input) =>
    updateMenuItem(menuItemId, input),
  )
  ipcMain.handle('menus:set-status', async (_event, menuItemId: string, status) =>
    setMenuItemStatus(menuItemId, status),
  )
  ipcMain.handle('menus:get-image-preview-url', async (_event, imagePath: string) =>
    getMenuImagePreviewUrl(imagePath),
  )
  ipcMain.handle('schedule:get-week', async (_event, anchorDate: string) => getWeekSchedule(anchorDate))
  ipcMain.handle('schedule:get-range', async (_event, startDate: string, endDate: string) =>
    getScheduleRange(startDate, endDate),
  )
  ipcMain.handle('schedule:upsert-day-note', async (_event, date: string, generalNote: string | null) =>
    upsertDayNote(date, generalNote),
  )
  ipcMain.handle('schedule:add-vendor-to-day', async (_event, date: string, vendorId: string) =>
    addVendorToDay(date, vendorId),
  )
  ipcMain.handle(
    'schedule:update-vendor-note',
    async (_event, scheduledVendorId: string, vendorNote: string | null) =>
      updateScheduledVendorNote(scheduledVendorId, vendorNote),
  )
  ipcMain.handle('schedule:remove-vendor-from-day', async (_event, scheduledVendorId: string) =>
    removeVendorFromDay(scheduledVendorId),
  )
  ipcMain.handle('backup:export-json', async () => exportJsonBackup(mainWindow))
  ipcMain.handle('backup:import-json', async () => importJsonBackup(mainWindow))
  ipcMain.handle('backup:export-vendors-csv', async () => exportVendorsCsv(mainWindow))
  ipcMain.handle('backup:export-menus-csv', async () => exportMenusCsv(mainWindow))
}

async function bootstrapApp() {
  initializeDatabase(getDatabasePath())
  registerIpcHandlers()

  await createMainWindow()
}

app.whenReady().then(bootstrapApp)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow()
  }
})
