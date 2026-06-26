import type {
  MenuItem,
  MenuItemStatus,
  ScheduleDay,
  ScheduledVendor,
  Vendor,
  VendorStatus,
} from './domain.js'

export interface DatabaseBootstrapInfo {
  databasePath: string
  schemaVersion: number
  tables: string[]
  isReady: boolean
}

export interface BackupOperationResult {
  filePath: string
  counts: {
    vendors: number
    menuItems: number
    scheduleDays: number
    scheduledVendors: number
  }
}

export interface BackupRestoreResult extends BackupOperationResult {
  importedAt: string
}

export interface VendorInput {
  name: string
  type: string
  location: string
  phoneNumber: string
}

export interface MenuItemInput {
  name: string
  price: number
  imagePath: string | null
}

export interface ScheduledVendorView extends ScheduledVendor {
  vendor: Vendor
  isBaruJual: boolean
  latestScheduledDate: string
}

export interface ScheduleDayView extends ScheduleDay {
  vendors: ScheduledVendorView[]
}

export interface AddVendorToScheduleInput {
  date: string
  vendorId: string
}

export interface ResellerDesktopApi {
  app: {
    getBootstrapInfo: () => Promise<DatabaseBootstrapInfo>
  }
  vendors: {
    list: () => Promise<Vendor[]>
    getById: (vendorId: string) => Promise<Vendor | null>
    create: (input: VendorInput) => Promise<Vendor>
    update: (vendorId: string, input: VendorInput) => Promise<Vendor>
    setStatus: (vendorId: string, status: VendorStatus) => Promise<Vendor>
  }
  menus: {
    listByVendor: (vendorId: string) => Promise<MenuItem[]>
    create: (vendorId: string, input: MenuItemInput) => Promise<MenuItem>
    update: (menuItemId: string, input: MenuItemInput) => Promise<MenuItem>
    setStatus: (menuItemId: string, status: MenuItemStatus) => Promise<MenuItem>
    selectImage: () => Promise<string | null>
    getImagePreviewUrl: (imagePath: string) => Promise<string | null>
  }
  schedule: {
    getWeek: (anchorDate: string) => Promise<ScheduleDayView[]>
    getRange: (startDate: string, endDate: string) => Promise<ScheduleDayView[]>
    upsertDayNote: (date: string, generalNote: string | null) => Promise<ScheduleDayView>
    addVendorToDay: (input: AddVendorToScheduleInput) => Promise<ScheduleDayView>
    updateVendorNote: (scheduledVendorId: string, vendorNote: string | null) => Promise<ScheduleDayView>
    removeVendorFromDay: (scheduledVendorId: string) => Promise<ScheduleDayView>
  }
  backup: {
    exportJson: () => Promise<BackupOperationResult | null>
    importJson: () => Promise<BackupRestoreResult | null>
    exportVendorsCsv: () => Promise<BackupOperationResult | null>
    exportMenusCsv: () => Promise<BackupOperationResult | null>
  }
}
