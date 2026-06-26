export type VendorStatus = 'active' | 'cooldown'

export type MenuItemStatus = 'active' | 'archived'

export const VENDOR_TYPE_OPTIONS = [
  'Makanan berat',
  'Makanan ringan',
  'Minuman',
  'Lainnya',
] as const

export type VendorTypeOption = (typeof VENDOR_TYPE_OPTIONS)[number]

export interface Vendor {
  id: string
  name: string
  type: string
  location: string
  phoneNumber: string
  status: VendorStatus
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  id: string
  vendorId: string
  name: string
  price: number
  imagePath: string | null
  status: MenuItemStatus
  createdAt: string
  updatedAt: string
}

export interface ScheduleDay {
  id: string
  date: string
  generalNote: string | null
}

export interface ScheduledVendor {
  id: string
  scheduleDayId: string
  vendorId: string
  vendorNote: string | null
  sortOrder: number
}
