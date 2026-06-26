import { contextBridge, ipcRenderer } from 'electron'

import type { ResellerDesktopApi } from '../shared/desktop-api.js'

const resellerApi: ResellerDesktopApi = {
  app: {
    getBootstrapInfo: () => ipcRenderer.invoke('app:get-bootstrap-info'),
  },
  vendors: {
    list: () => ipcRenderer.invoke('vendors:list'),
    getById: (vendorId) => ipcRenderer.invoke('vendors:get-by-id', vendorId),
    create: (input) => ipcRenderer.invoke('vendors:create', input),
    update: (vendorId, input) => ipcRenderer.invoke('vendors:update', vendorId, input),
    setStatus: (vendorId, status) => ipcRenderer.invoke('vendors:set-status', vendorId, status),
  },
  menus: {
    listByVendor: (vendorId) => ipcRenderer.invoke('menus:list-by-vendor', vendorId),
    create: (vendorId, input) => ipcRenderer.invoke('menus:create', vendorId, input),
    update: (menuItemId, input) => ipcRenderer.invoke('menus:update', menuItemId, input),
    setStatus: (menuItemId, status) => ipcRenderer.invoke('menus:set-status', menuItemId, status),
    selectImage: () => ipcRenderer.invoke('menus:select-image'),
    getImagePreviewUrl: (imagePath) => ipcRenderer.invoke('menus:get-image-preview-url', imagePath),
  },
  schedule: {
    getWeek: (anchorDate) => ipcRenderer.invoke('schedule:get-week', anchorDate),
    getRange: (startDate, endDate) => ipcRenderer.invoke('schedule:get-range', startDate, endDate),
    upsertDayNote: (date, generalNote) =>
      ipcRenderer.invoke('schedule:upsert-day-note', date, generalNote),
    addVendorToDay: (input) =>
      ipcRenderer.invoke('schedule:add-vendor-to-day', input.date, input.vendorId),
    updateVendorNote: (scheduledVendorId, vendorNote) =>
      ipcRenderer.invoke('schedule:update-vendor-note', scheduledVendorId, vendorNote),
    removeVendorFromDay: (scheduledVendorId) =>
      ipcRenderer.invoke('schedule:remove-vendor-from-day', scheduledVendorId),
  },
  backup: {
    exportJson: () => ipcRenderer.invoke('backup:export-json'),
    importJson: () => ipcRenderer.invoke('backup:import-json'),
    exportVendorsCsv: () => ipcRenderer.invoke('backup:export-vendors-csv'),
    exportMenusCsv: () => ipcRenderer.invoke('backup:export-menus-csv'),
  },
}

contextBridge.exposeInMainWorld('reseller', resellerApi)
