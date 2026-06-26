import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type AppLanguage = 'en' | 'id'

type TranslationMap = Record<string, { en: string; id: string }>

const STORAGE_KEY = 'reseller-language'

const translations: TranslationMap = {
  appTitle: {
    en: 'Vendor scheduling workspace',
    id: 'Ruang kerja jadwal vendor',
  },
  scheduleCalendar: {
    en: 'Schedule calendar',
    id: 'Kalender jadwal',
  },
  useWeekOrMonth: {
    en: 'Use week or month view, then click a day cell to manage that day in a popup.',
    id: 'Gunakan tampilan minggu atau bulan, lalu klik sel hari untuk mengelola hari itu di popup.',
  },
  schedule: {
    en: 'Schedule',
    id: 'Jadwal',
  },
  vendors: {
    en: 'Vendors',
    id: 'Vendor',
  },
  vendorMasterData: {
    en: 'Vendor master data',
    id: 'Data master vendor',
  },
  vendorMasterDescription: {
    en: 'Start by keeping the vendor list clean and searchable. This data will feed the weekly schedule page next.',
    id: 'Mulailah dengan menjaga daftar vendor tetap rapi dan mudah dicari. Data ini akan dipakai oleh halaman jadwal berikutnya.',
  },
  addVendor: {
    en: 'Add vendor',
    id: 'Tambah vendor',
  },
  filters: {
    en: 'Filters',
    id: 'Filter',
  },
  searchVendorName: {
    en: 'Search vendor name',
    id: 'Cari nama vendor',
  },
  typeVendorName: {
    en: 'Type a vendor name',
    id: 'Ketik nama vendor',
  },
  filterByVendorType: {
    en: 'Filter by vendor type',
    id: 'Filter berdasarkan jenis vendor',
  },
  location: {
    en: 'Location',
    id: 'Lokasi',
  },
  vendorName: {
    en: 'Vendor name',
    id: 'Nama vendor',
  },
  vendorType: {
    en: 'Vendor type',
    id: 'Jenis vendor',
  },
  menuName: {
    en: 'Menu name',
    id: 'Nama menu',
  },
  latestPrice: {
    en: 'Latest price',
    id: 'Harga terbaru',
  },
  exampleMenuName: {
    en: 'Example: Nasi goreng special',
    id: 'Contoh: Nasi goreng spesial',
  },
  examplePrice: {
    en: 'Example: 25000',
    id: 'Contoh: 25000',
  },
  uploadImage: {
    en: 'Upload image',
    id: 'Unggah gambar',
  },
  selectingImage: {
    en: 'Selecting image...',
    id: 'Memilih gambar...',
  },
  removeImage: {
    en: 'Remove image',
    id: 'Hapus gambar',
  },
  selectedImage: {
    en: 'Selected image',
    id: 'Gambar terpilih',
  },
  previewUnavailable: {
    en: 'Preview unavailable',
    id: 'Pratinjau tidak tersedia',
  },
  noImageSelected: {
    en: 'No image selected yet. Uploaded files are copied into the app\'s local storage.',
    id: 'Belum ada gambar yang dipilih. File yang diunggah akan disalin ke penyimpanan lokal aplikasi.',
  },
  phoneNumber: {
    en: 'Phone number',
    id: 'Nomor telepon',
  },
  selectVendorType: {
    en: 'Select vendor type',
    id: 'Pilih jenis vendor',
  },
  exampleSate: {
    en: 'Example: Sate Pak Budi',
    id: 'Contoh: Sate Pak Budi',
  },
  exampleLocation: {
    en: 'Example: Kebayoran Baru',
    id: 'Contoh: Kebayoran Baru',
  },
  examplePhone: {
    en: 'Example: 0812-3456-7890',
    id: 'Contoh: 0812-3456-7890',
  },
  saveVendorError: {
    en: 'Unable to save vendor.',
    id: 'Tidak dapat menyimpan vendor.',
  },
  saveMenuError: {
    en: 'Unable to save menu item.',
    id: 'Tidak dapat menyimpan menu.',
  },
  saving: {
    en: 'Saving...',
    id: 'Menyimpan...',
  },
  cancel: {
    en: 'Cancel',
    id: 'Batal',
  },
  allVendorTypes: {
    en: 'All vendor types',
    id: 'Semua jenis vendor',
  },
  sortVendors: {
    en: 'Sort vendors',
    id: 'Urutkan vendor',
  },
  nameAZ: {
    en: 'Name A-Z',
    id: 'Nama A-Z',
  },
  nameZA: {
    en: 'Name Z-A',
    id: 'Nama Z-A',
  },
  vendorList: {
    en: 'Vendor list',
    id: 'Daftar vendor',
  },
  shown: {
    en: 'shown',
    id: 'ditampilkan',
  },
  loadingVendors: {
    en: 'Loading vendors...',
    id: 'Memuat vendor...',
  },
  noVendorsMatch: {
    en: 'No vendors match the current filters yet.',
    id: 'Belum ada vendor yang cocok dengan filter saat ini.',
  },
  viewDetails: {
    en: 'View details',
    id: 'Lihat detail',
  },
  details: {
    en: 'Details',
    id: 'Detail',
  },
  loadingVendorDetails: {
    en: 'Loading vendor details...',
    id: 'Memuat detail vendor...',
  },
  backToVendors: {
    en: 'Back to vendors',
    id: 'Kembali ke vendor',
  },
  vendorDetail: {
    en: 'Vendor detail',
    id: 'Detail vendor',
  },
  editCoreVendor: {
    en: 'Edit the core vendor information.',
    id: 'Ubah informasi inti vendor.',
  },
  menuItems: {
    en: 'Menu items',
    id: 'Daftar menu',
  },
  item: {
    en: 'item',
    id: 'item',
  },
  items: {
    en: 'items',
    id: 'item',
  },
  addMenuItem: {
    en: 'Add menu item',
    id: 'Tambah menu',
  },
  createMenuEntries: {
    en: 'Create menu entries with the latest price for this vendor.',
    id: 'Buat menu dengan harga terbaru untuk vendor ini.',
  },
  noMenuItemsYet: {
    en: 'No menu items yet. Add the first one using the button above.',
    id: 'Belum ada menu. Tambahkan yang pertama dengan tombol di atas.',
  },
  futureScheduleFlag: {
    en: 'Future schedule flag',
    id: 'Penanda jadwal mendatang',
  },
  backupMenu: {
    en: 'Backup and export',
    id: 'Cadangan dan ekspor',
  },
  exportJsonBackup: {
    en: 'Export JSON backup',
    id: 'Ekspor cadangan JSON',
  },
  importJsonBackup: {
    en: 'Import JSON backup',
    id: 'Impor cadangan JSON',
  },
  exportVendorsCsv: {
    en: 'Export vendors CSV',
    id: 'Ekspor CSV vendor',
  },
  exportMenusCsv: {
    en: 'Export menus CSV',
    id: 'Ekspor CSV menu',
  },
  language: {
    en: 'Language',
    id: 'Bahasa',
  },
  english: {
    en: 'English',
    id: 'Inggris',
  },
  indonesian: {
    en: 'Indonesian',
    id: 'Indonesia',
  },
  loadingMenuItems: {
    en: 'Loading menu items...',
    id: 'Memuat menu...',
  },
  noMenuItemsForVendor: {
    en: 'No menu items yet for this vendor.',
    id: 'Belum ada menu untuk vendor ini.',
  },
  vendorNote: {
    en: 'Vendor note',
    id: 'Catatan vendor',
  },
  saveNote: {
    en: 'Save note',
    id: 'Simpan catatan',
  },
  addVendorNote: {
    en: 'Add a note for this vendor on this day',
    id: 'Tambahkan catatan untuk vendor ini pada hari ini',
  },
  remove: {
    en: 'Remove',
    id: 'Hapus',
  },
  addGeneralNote: {
    en: 'Add a general note or reminder for this day',
    id: 'Tambahkan catatan umum atau pengingat untuk hari ini',
  },
  dayNote: {
    en: 'General note',
    id: 'Catatan umum',
  },
  saveDayNote: {
    en: 'Save day note',
    id: 'Simpan catatan hari',
  },
  manageVendorsAndNotes: {
    en: 'Manage vendors and notes for this day.',
    id: 'Kelola vendor dan catatan untuk hari ini.',
  },
  addVendorForDay: {
    en: 'Add vendors for',
    id: 'Tambahkan vendor untuk',
  },
  pickVendorsForDay: {
    en: 'Pick vendors for this day.',
    id: 'Pilih vendor untuk hari ini.',
  },
  searchVendorNamePlaceholder: {
    en: 'Search vendor name',
    id: 'Cari nama vendor',
  },
  loadingSchedule: {
    en: 'Loading schedule...',
    id: 'Memuat jadwal...',
  },
  noVendorsScheduled: {
    en: 'No vendors scheduled.',
    id: 'Belum ada vendor dijadwalkan.',
  },
  noVendorsScheduledYet: {
    en: 'No vendors scheduled yet for this day.',
    id: 'Belum ada vendor dijadwalkan untuk hari ini.',
  },
  sundayVisibleNotice: {
    en: 'Sunday is visible in the calendar for context, but scheduling is disabled for this day.',
    id: 'Minggu tetap terlihat di kalender untuk konteks, tetapi penjadwalan dinonaktifkan untuk hari ini.',
  },
  pastDayReadOnly: {
    en: 'This day is in the past, so it is read-only.',
    id: 'Hari ini sudah lewat, jadi hanya bisa dilihat.',
  },
  generalNote: {
    en: 'General note',
    id: 'Catatan umum',
  },
  noAvailableVendors: {
    en: 'No available vendors match the current filters.',
    id: 'Tidak ada vendor yang cocok dengan filter saat ini.',
  },
  scheduleCalendarTitle: {
    en: 'Schedule calendar',
    id: 'Kalender jadwal',
  },
  today: {
    en: 'Today',
    id: 'Hari ini',
  },
  off: {
    en: 'Off',
    id: 'Libur',
  },
  inactive: {
    en: 'Inactive',
    id: 'Tidak aktif',
  },
  active: {
    en: 'Active',
    id: 'Aktif',
  },
}

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  t: (key: keyof typeof translations) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)
  return storedValue === 'id' ? 'id' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(readInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => translations[key]?.[language] ?? String(key),
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.')
  }

  return context
}
