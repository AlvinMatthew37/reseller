import { useEffect, useRef, useState } from 'react'

import { FileText } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useLanguage } from '../lib/language'

const navigationItems = [
  { to: '/', labelKey: 'schedule' },
  { to: '/vendors', labelKey: 'vendors' },
] as const

export function AppShell() {
  const { language, setLanguage, t } = useLanguage()
  const [backupMenuOpen, setBackupMenuOpen] = useState(false)
  const backupMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!backupMenuRef.current) {
        return
      }

      if (event.target instanceof Node && backupMenuRef.current.contains(event.target)) {
        return
      }

      setBackupMenuOpen(false)
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  async function handleExportJsonBackup() {
    try {
      const result = await window.reseller.backup.exportJson()
      if (result) {
        window.alert(`JSON backup saved to:\n${result.filePath}`)
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export JSON backup.')
    }
  }

  async function handleImportJsonBackup() {
    const shouldImport = window.confirm(
      'Importing a backup will replace all current data in the app. Continue?',
    )

    if (!shouldImport) {
      return
    }

    try {
      const result = await window.reseller.backup.importJson()
      if (result) {
        window.alert(`Backup restored from:\n${result.filePath}`)
        window.location.reload()
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to import JSON backup.')
    }
  }

  async function handleExportVendorsCsv() {
    try {
      const result = await window.reseller.backup.exportVendorsCsv()
      if (result) {
        window.alert(`Vendors CSV saved to:\n${result.filePath}`)
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export vendors CSV.')
    }
  }

  async function handleExportMenusCsv() {
    try {
      const result = await window.reseller.backup.exportMenusCsv()
      if (result) {
        window.alert(`Menus CSV saved to:\n${result.filePath}`)
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export menus CSV.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[96rem] flex-col gap-6 px-6 py-8">
        <header className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                  Reseller
                </p>
                <div className="relative" ref={backupMenuRef}>
                  <button
                    type="button"
                    onClick={() => setBackupMenuOpen((current) => !current)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                    aria-label={t('backupMenu')}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {backupMenuOpen ? (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                      <button
                        type="button"
                        onClick={() => {
                          setBackupMenuOpen(false)
                          void handleExportJsonBackup()
                        }}
                        className="block w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {t('exportJsonBackup')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBackupMenuOpen(false)
                          void handleImportJsonBackup()
                        }}
                        className="block w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {t('importJsonBackup')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBackupMenuOpen(false)
                          void handleExportVendorsCsv()
                        }}
                        className="block w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {t('exportVendorsCsv')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBackupMenuOpen(false)
                          void handleExportMenusCsv()
                        }}
                        className="block w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {t('exportMenusCsv')}
                      </button>
                    </div>
                  ) : null}
                </div>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as 'en' | 'id')}
                  className="h-7 rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-700 outline-none transition hover:bg-slate-200"
                  aria-label={t('language')}
                >
                  <option value="en">{t('english')}</option>
                  <option value="id">{t('indonesian')}</option>
                </select>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t('appTitle')}</h1>
            </div>

            <nav className="flex flex-wrap gap-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
