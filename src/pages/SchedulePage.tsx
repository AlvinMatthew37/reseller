import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import { VENDOR_TYPE_OPTIONS } from '../../shared/domain'
import type {
  AddVendorToScheduleInput,
  ScheduleDayView,
  ScheduledVendorView,
} from '../../shared/desktop-api'
import type { MenuItem } from '../../shared/domain'
import { useLanguage } from '../lib/language'

type CalendarView = 'week' | 'month'

const MONTH_WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SUNDAY_FIRST_WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDateParts(dateText: string) {
  const [year, month, day] = dateText.split('-').map(Number)
  return { year, month, day }
}

function toDateOnly(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateOnly(dateText: string) {
  const { year, month, day } = getDateParts(dateText)
  return new Date(year, month - 1, day)
}

function getWeekdayIndex(dateText: string) {
  const { year, month, day } = getDateParts(dateText)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function startOfWeekMonday(date: Date) {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  nextDate.setDate(nextDate.getDate() + diff)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function startOfMonthGrid(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  return startOfWeekMonday(firstDay)
}

function endOfMonthGrid(date: Date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const weekStart = startOfWeekMonday(lastDay)
  return addDays(weekStart, 6)
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function formatLongDate(dateText: string) {
  const { day, month } = getDateParts(dateText)
  return `${SUNDAY_FIRST_WEEKDAY_LABELS[getWeekdayIndex(dateText)]}, ${day} ${new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })}`
}

function isSunday(dateText: string) {
  return getWeekdayIndex(dateText) === 0
}

function isToday(dateText: string) {
  return dateText === toDateOnly(new Date())
}

function isPastDay(dateText: string) {
  return dateText < toDateOnly(new Date())
}


interface VendorPickerModalProps {
  date: string
  scheduledVendorIds: string[]
  onAddVendor: (input: AddVendorToScheduleInput) => Promise<void>
  onClose: () => void
}

function VendorPickerModal({ date, scheduledVendorIds, onAddVendor, onClose }: VendorPickerModalProps) {
  const { t } = useLanguage()
  const [vendors, setVendors] = useState<Awaited<ReturnType<typeof window.reseller.vendors.list>>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.reseller.vendors
      .list()
      .then(setVendors)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredVendors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return vendors.filter((vendor) => {
      if (scheduledVendorIds.includes(vendor.id)) {
        return false
      }

      const matchesSearch =
        normalizedSearch.length === 0 || vendor.name.toLowerCase().includes(normalizedSearch)
      const matchesType = typeFilter === 'all' || vendor.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [scheduledVendorIds, searchTerm, typeFilter, vendors])

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/45 px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('addVendorForDay')} {formatLongDate(date)}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('pickVendorsForDay')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            {t('cancel')}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px]">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            placeholder={t('searchVendorName')}
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
          >
            <option value="all">{t('allVendorTypes')}</option>
            {VENDOR_TYPE_OPTIONS.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-3">
          {isLoading ? <p className="text-sm text-slate-600">Loading vendors...</p> : null}
          {!isLoading && filteredVendors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
              {t('noAvailableVendors')}
            </div>
          ) : null}
          {filteredVendors.map((vendor) => (
            <article
              key={vendor.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
            >
              <div>
                <h3 className="text-lg font-semibold">{vendor.name}</h3>
                <p className="text-sm text-slate-600">{vendor.type}</p>
                <p className="text-sm text-slate-600">{vendor.location}</p>
              </div>
              <button
                type="button"
                onClick={() => void onAddVendor({ date, vendorId: vendor.id })}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t('addVendor')}
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScheduledVendorItem({
  item,
  compact,
  onOpenDay,
}: {
  item: ScheduledVendorView
  compact?: boolean
  onOpenDay: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpenDay}
      className={`w-full max-w-full overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 text-left transition hover:bg-emerald-100 ${
        compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
      }`}
    >
      <div className={`flex min-w-0 ${compact ? 'flex-col items-start gap-1' : 'items-center gap-2'}`}>
        <span className="min-w-0 truncate font-medium">{item.vendor.name}</span>
        {item.isBaruJual ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Baru
          </span>
        ) : null}
      </div>
      {!compact ? <p className="truncate text-slate-600">{item.vendor.type}</p> : null}
    </button>
  )
}

function DayDetailModal({
  day,
  note,
  onClose,
  onChangeNote,
  onSaveDayNote,
  onOpenPicker,
  onSaveVendorNote,
  onRemoveVendor,
}: {
  day: ScheduleDayView
  note: string
  onClose: () => void
  onChangeNote: (value: string) => void
  onSaveDayNote: () => Promise<void>
  onOpenPicker: () => void
  onSaveVendorNote: (scheduledVendorId: string, note: string) => Promise<void>
  onRemoveVendor: (scheduledVendorId: string) => Promise<void>
}) {
  const { t } = useLanguage()
  const locked = isPastDay(day.date)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[calc(100vh-4rem)] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{formatLongDate(day.date)}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('manageVendorsAndNotes')}</p>
          </div>
          <div className="flex gap-2">
            {!isSunday(day.date) && !locked ? (
              <button
                type="button"
                onClick={onOpenPicker}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t('addVendor')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label={t('cancel')}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {isSunday(day.date) ? (
          <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            {t('sundayVisibleNotice')}
          </div>
        ) : null}

        {locked ? (
          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('pastDayReadOnly')}
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium text-slate-700">{t('dayNote')}</label>
          <textarea
            value={note}
            onChange={(event) => onChangeNote(event.target.value)}
            rows={3}
            disabled={locked}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            placeholder={t('addGeneralNote')}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void onSaveDayNote()}
              disabled={locked}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {t('saveDayNote')}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {day.vendors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
              {t('noVendorsScheduledYet')}
            </div>
          ) : null}

          {day.vendors.map((item) => (
            <DayVendorEditor
              key={item.id}
              item={item}
              isLocked={locked}
              onSaveNote={onSaveVendorNote}
              onRemove={onRemoveVendor}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DayVendorEditor({
  item,
  isLocked,
  onSaveNote,
  onRemove,
}: {
  item: ScheduledVendorView
  isLocked: boolean
  onSaveNote: (scheduledVendorId: string, note: string) => Promise<void>
  onRemove: (scheduledVendorId: string) => Promise<void>
}) {
  const { t } = useLanguage()
  const [note, setNote] = useState(item.vendorNote ?? '')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoadingMenus, setIsLoadingMenus] = useState(true)
  const [menuError, setMenuError] = useState<string | null>(null)

  useEffect(() => {
    setNote(item.vendorNote ?? '')
  }, [item.vendorNote])

  useEffect(() => {
    let isActive = true

    setIsLoadingMenus(true)
    setMenuError(null)

    window.reseller.menus
      .listByVendor(item.vendor.id)
      .then((response) => {
        if (isActive) {
          setMenuItems(response)
        }
      })
      .catch((error) => {
        if (isActive) {
          setMenuError(error instanceof Error ? error.message : 'Unable to load menu items.')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingMenus(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [item.vendor.id])

  async function toggleMenuStatus(menuItem: MenuItem) {
    await window.reseller.menus.setStatus(
      menuItem.id,
      menuItem.status === 'active' ? 'archived' : 'active',
    )
    const refreshedMenuItems = await window.reseller.menus.listByVendor(item.vendor.id)
    setMenuItems(refreshedMenuItems)
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{item.vendor.name}</h3>
            {item.isBaruJual ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {t('today')}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">{item.vendor.type}</p>
          <p className="text-sm text-slate-600">{item.vendor.location}</p>
        </div>
        <button
          type="button"
          onClick={() => void onRemove(item.id)}
          disabled={isLocked}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
        >
          {t('remove')}
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Menu items</h4>
            <p className="text-xs text-slate-500">
              {menuItems.length} item{menuItems.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {isLoadingMenus ? <p className="mt-3 text-sm text-slate-600">Loading menu items...</p> : null}
        {menuError ? <p className="mt-3 text-sm text-rose-700">{menuError}</p> : null}
        {!isLoadingMenus && !menuError && menuItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No menu items yet for this vendor.</p>
        ) : null}

        <div className="mt-3 grid gap-2">
          {menuItems.map((menuItem) => (
            <div
              key={menuItem.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">{menuItem.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      menuItem.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {menuItem.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">Rp {menuItem.price.toLocaleString('id-ID')}</p>
                {menuItem.description ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                    {menuItem.description}
                  </p>
                ) : null}
              </div>

          <button
            type="button"
            onClick={() => void toggleMenuStatus(menuItem)}
            disabled={isLocked}
            className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition ${
              menuItem.status === 'active'
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-slate-300 bg-slate-300'
                }`}
                aria-label={`${menuItem.name} status is ${menuItem.status}. Toggle status.`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    menuItem.status === 'active' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">
                  {menuItem.status === 'active' ? 'Active' : 'Archived'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium text-slate-700">{t('vendorNote')}</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          disabled={isLocked}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
          placeholder={t('addVendorNote')}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void onSaveNote(item.id, note)}
            disabled={isLocked}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t('saveNote')}
          </button>
        </div>
      </div>
    </article>
  )
}

interface CalendarCellProps {
  day: ScheduleDayView
  currentMonth: number
  onOpenDay: () => void
}

function CalendarCell({ day, currentMonth, onOpenDay }: CalendarCellProps) {
  const { t } = useLanguage()
  const { day: dayOfMonth, month } = getDateParts(day.date)
  const inCurrentMonth = month - 1 === currentMonth
  const sunday = getWeekdayIndex(day.date) === 0
  const today = isToday(day.date)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDay()
        }
      }}
      className={`flex min-h-[10rem] flex-col rounded-none border-r border-b border-slate-200 p-3 text-left transition cursor-pointer ${
        today
          ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-500'
          : sunday
            ? 'bg-slate-50'
            : 'bg-white hover:bg-slate-50'
      } ${inCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            today ? 'text-emerald-700' : sunday ? 'text-slate-400' : ''
          }`}
        >
          {dayOfMonth}
        </span>
        <div className="flex items-center gap-2">
          {today ? (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Today
            </span>
          ) : null}
          {sunday ? (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('off')}
            </span>
          ) : null}
        </div>
      </div>

      {day.generalNote ? (
        <p className="mt-3 line-clamp-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
          {day.generalNote}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {day.vendors.map((item) => (
          <ScheduledVendorItem key={item.id} item={item} onOpenDay={onOpenDay} />
        ))}
      </div>
    </div>
  )
}


interface WeekCellProps {
  day: ScheduleDayView
  onOpenDay: () => void
}

function WeekCell({ day, onOpenDay }: WeekCellProps) {
  const { t } = useLanguage()
  const { day: dayOfMonth, month } = getDateParts(day.date)
  const today = isToday(day.date)
  const sunday = isSunday(day.date)
  const inCurrentMonth = month - 1 === fromDateOnly(day.date).getMonth()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDay()
        }
      }}
      className={`flex h-full min-h-0 flex-col rounded-3xl border p-4 text-left shadow-sm transition cursor-pointer ${today
        ? 'border-emerald-500 bg-emerald-50'
        : sunday
          ? 'border-slate-200 bg-slate-50'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      } ${inCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-sm font-medium ${today ? 'text-emerald-700' : sunday ? 'text-slate-400' : ''}`}>
            {MONTH_WEEKDAY_LABELS[getWeekdayIndex(day.date)]}
          </div>
          <div className="mt-1 text-xl font-semibold">{dayOfMonth}</div>
        </div>
        <div className="flex items-center gap-2">
          {today ? (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {t('today')}
            </span>
          ) : null}
          {sunday ? (
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('off')}
            </span>
          ) : null}
        </div>
      </div>

      {day.generalNote ? (
        <p className="mt-4 line-clamp-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
          {day.generalNote}
        </p>
      ) : null}

      <div className="mt-4 grid flex-1 content-start gap-2 overflow-hidden">
        {day.vendors.map((item) => (
          <ScheduledVendorItem key={item.id} item={item} compact onOpenDay={onOpenDay} />
        ))}
      </div>
    </div>
  )
}

export function SchedulePage() {
  const { t } = useLanguage()
  const [view, setView] = useState<CalendarView>('month')
  const [anchorDate, setAnchorDate] = useState(() => toDateOnly(new Date()))
  const [daysByDate, setDaysByDate] = useState<Record<string, ScheduleDayView>>({})
  const [visibleDates, setVisibleDates] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pickerDate, setPickerDate] = useState<string | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null)
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({})

  const anchorAsDate = useMemo(() => fromDateOnly(anchorDate), [anchorDate])

  const range = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeekMonday(anchorAsDate)
      const end = addDays(start, 6)
      return { start, end }
    }

    return {
      start: startOfMonthGrid(anchorAsDate),
      end: endOfMonthGrid(anchorAsDate),
    }
  }, [anchorAsDate, view])

  async function loadRange() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await window.reseller.schedule.getRange(
        toDateOnly(range.start),
        toDateOnly(range.end),
      )

      const nextByDate = Object.fromEntries(result.map((day) => [day.date, day]))
      setDaysByDate(nextByDate)
      setVisibleDates(result.map((day) => day.date))
      setDayNotes(Object.fromEntries(result.map((day) => [day.date, day.generalNote ?? ''])))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load schedule.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRange()
  }, [range.start.getTime(), range.end.getTime()])

  function updateDayState(updatedDay: ScheduleDayView) {
    setDaysByDate((current) => ({ ...current, [updatedDay.date]: updatedDay }))
    setDayNotes((current) => ({ ...current, [updatedDay.date]: updatedDay.generalNote ?? current[updatedDay.date] ?? '' }))
  }

  async function handleSaveDayNote(date: string) {
    const updatedDay = await window.reseller.schedule.upsertDayNote(date, dayNotes[date] ?? '')
    updateDayState(updatedDay)
  }

  async function handleAddVendor(input: AddVendorToScheduleInput) {
    const updatedDay = await window.reseller.schedule.addVendorToDay(input)
    updateDayState(updatedDay)
    setPickerDate(null)
  }

  async function handleSaveVendorNote(scheduledVendorId: string, note: string) {
    const updatedDay = await window.reseller.schedule.updateVendorNote(scheduledVendorId, note)
    updateDayState(updatedDay)
  }

  async function handleRemoveVendor(scheduledVendorId: string) {
    const updatedDay = await window.reseller.schedule.removeVendorFromDay(scheduledVendorId)
    updateDayState(updatedDay)
  }

  const selectedDay = selectedDayDate ? daysByDate[selectedDayDate] ?? null : null

  const visibleDays = visibleDates
    .map((date) => daysByDate[date])
    .filter((day): day is ScheduleDayView => Boolean(day))

  const monthRows = useMemo(() => {
    const rows: ScheduleDayView[][] = []
    for (let index = 0; index < visibleDays.length; index += 7) {
      rows.push(visibleDays.slice(index, index + 7))
    }
    return rows
  }, [visibleDays])

  function moveCalendar(offset: number) {
    if (view === 'week') {
      setAnchorDate(toDateOnly(addDays(anchorAsDate, offset * 7)))
      return
    }

    const nextDate = new Date(anchorAsDate.getFullYear(), anchorAsDate.getMonth() + offset, 1)
    setAnchorDate(toDateOnly(nextDate))
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{t('scheduleCalendarTitle')}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{t('useWeekOrMonth')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setAnchorDate(toDateOnly(new Date()))}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {t('today')}
              </button>
              <button
                type="button"
                onClick={() => moveCalendar(-1)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {t('previous')}
              </button>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {formatMonthYear(anchorAsDate)}
              </div>
              <button
                type="button"
                onClick={() => moveCalendar(1)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {t('next')}
              </button>
              <div className="ml-2 inline-flex rounded-full bg-slate-100 p-1">
                {(['week', 'month'] as CalendarView[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      view === option
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {option === 'week' ? t('week') : t('month')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
        ) : null}

        {isLoading ? <p className="text-sm text-slate-600">{t('loadingSchedule')}</p> : null}

        {view === 'week' ? (
          <section className="grid min-h-[calc(100vh-20rem)] items-stretch gap-4 xl:grid-cols-7">
            {visibleDays.map((day) => (
              <WeekCell key={day.date} day={day} onOpenDay={() => setSelectedDayDate(day.date)} />
            ))}
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {MONTH_WEEKDAY_LABELS.map((label) => (
                <div key={label} className="px-3 py-3 text-sm font-medium text-slate-600">
                  {label}
                </div>
              ))}
            </div>

            <div>
              {monthRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7">
                  {row.map((day) => (
                    <CalendarCell
                      key={day.date}
                      day={day}
                      currentMonth={anchorAsDate.getMonth()}
                      onOpenDay={() => setSelectedDayDate(day.date)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {selectedDay ? (
        <DayDetailModal
          day={selectedDay}
          note={dayNotes[selectedDay.date] ?? ''}
          onClose={() => setSelectedDayDate(null)}
          onChangeNote={(value) =>
            setDayNotes((current) => ({ ...current, [selectedDay.date]: value }))
          }
          onSaveDayNote={() => handleSaveDayNote(selectedDay.date)}
          onOpenPicker={() => setPickerDate(selectedDay.date)}
          onSaveVendorNote={handleSaveVendorNote}
          onRemoveVendor={handleRemoveVendor}
        />
      ) : null}

      {pickerDate ? (
        <VendorPickerModal
          date={pickerDate}
          scheduledVendorIds={
            daysByDate[pickerDate]?.vendors.map((vendor) => vendor.vendorId) ?? []
          }
          onAddVendor={handleAddVendor}
          onClose={() => setPickerDate(null)}
        />
      ) : null}
    </>
  )
}
