import { randomUUID } from 'node:crypto'

import type { ScheduleDayView, ScheduledVendorView } from '../../shared/desktop-api.js'
import { getDatabase } from './client.js'

interface ScheduleDayRow {
  id: string
  date: string
  general_note: string | null
}

interface ScheduledVendorRow {
  scheduled_vendor_id: string
  schedule_day_id: string
  vendor_id: string
  vendor_note: string | null
  sort_order: number
  vendor_name: string
  vendor_type: string
  vendor_location: string
  vendor_phone_number: string
  vendor_status: 'active' | 'cooldown'
  vendor_created_at: string
  vendor_updated_at: string
}

function toDateOnly(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateOnly(dateText: string) {
  const [year, month, day] = dateText.split('-').map(Number)
  return new Date(year, month - 1, day)
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

function ensureScheduleDay(date: string) {
  const db = getDatabase()
  const existing = db
    .prepare(
      `
        SELECT id, date, general_note
        FROM schedule_days
        WHERE date = ?
      `,
    )
    .get(date) as ScheduleDayRow | undefined

  if (existing) {
    return existing
  }

  const scheduleDayId = randomUUID()
  db.prepare(
    `
      INSERT INTO schedule_days (id, date, general_note)
      VALUES (?, ?, NULL)
    `,
  ).run(scheduleDayId, date)

  return {
    id: scheduleDayId,
    date,
    general_note: null,
  }
}

function getLatestScheduledDateByVendorIds(vendorIds: string[]) {
  if (vendorIds.length === 0) {
    return new Map<string, string>()
  }

  const placeholders = vendorIds.map(() => '?').join(', ')
  const rows = getDatabase()
    .prepare(
      `
        SELECT sv.vendor_id, MAX(sd.date) AS latest_date
        FROM scheduled_vendors sv
        JOIN schedule_days sd ON sd.id = sv.schedule_day_id
        WHERE sv.vendor_id IN (${placeholders})
        GROUP BY sv.vendor_id
      `,
    )
    .all(...vendorIds) as { vendor_id: string; latest_date: string }[]

  return new Map(rows.map((row) => [row.vendor_id, row.latest_date]))
}

function computeBaruJual(latestScheduledDate: string) {
  const today = fromDateOnly(toDateOnly(new Date()))
  const latest = fromDateOnly(latestScheduledDate)
  const startMark = addDays(latest, -1)
  const endMark = addDays(latest, 7)

  return today >= startMark && today <= endMark
}

function getScheduledVendorsForDay(scheduleDayId: string): ScheduledVendorView[] {
  const rows = getDatabase()
    .prepare(
      `
        SELECT
          sv.id AS scheduled_vendor_id,
          sv.schedule_day_id,
          sv.vendor_id,
          sv.vendor_note,
          sv.sort_order,
          v.name AS vendor_name,
          v.type AS vendor_type,
          v.location AS vendor_location,
          v.phone_number AS vendor_phone_number,
          v.status AS vendor_status,
          v.created_at AS vendor_created_at,
          v.updated_at AS vendor_updated_at
        FROM scheduled_vendors sv
        JOIN vendors v ON v.id = sv.vendor_id
        WHERE sv.schedule_day_id = ?
        ORDER BY sv.sort_order ASC, v.name COLLATE NOCASE ASC
      `,
    )
    .all(scheduleDayId) as ScheduledVendorRow[]

  const latestDateMap = getLatestScheduledDateByVendorIds(rows.map((row) => row.vendor_id))

  return rows.map((row) => {
    const latestScheduledDate = latestDateMap.get(row.vendor_id) ?? ''

    return {
      id: row.scheduled_vendor_id,
      scheduleDayId: row.schedule_day_id,
      vendorId: row.vendor_id,
      vendorNote: row.vendor_note,
      sortOrder: row.sort_order,
      vendor: {
        id: row.vendor_id,
        name: row.vendor_name,
        type: row.vendor_type,
        location: row.vendor_location,
        phoneNumber: row.vendor_phone_number,
        status: row.vendor_status,
        createdAt: row.vendor_created_at,
        updatedAt: row.vendor_updated_at,
      },
      latestScheduledDate,
      isBaruJual: latestScheduledDate ? computeBaruJual(latestScheduledDate) : false,
    }
  })
}

export function getScheduleDayViewByDate(date: string): ScheduleDayView {
  const scheduleDay = ensureScheduleDay(date)

  return {
    id: scheduleDay.id,
    date: scheduleDay.date,
    generalNote: scheduleDay.general_note,
    vendors: getScheduledVendorsForDay(scheduleDay.id),
  }
}

export function getWeekSchedule(anchorDate: string): ScheduleDayView[] {
  const weekStart = startOfWeekMonday(fromDateOnly(anchorDate))

  return Array.from({ length: 7 }, (_, index) =>
    getScheduleDayViewByDate(toDateOnly(addDays(weekStart, index))),
  )
}

export function getScheduleRange(startDate: string, endDate: string): ScheduleDayView[] {
  const days: ScheduleDayView[] = []
  let currentDate = fromDateOnly(startDate)
  const finalDate = fromDateOnly(endDate)

  while (currentDate <= finalDate) {
    days.push(getScheduleDayViewByDate(toDateOnly(currentDate)))
    currentDate = addDays(currentDate, 1)
  }

  return days
}

export function upsertDayNote(date: string, generalNote: string | null): ScheduleDayView {
  const scheduleDay = ensureScheduleDay(date)

  getDatabase()
    .prepare(
      `
        UPDATE schedule_days
        SET general_note = ?
        WHERE id = ?
      `,
    )
    .run(generalNote?.trim() ? generalNote.trim() : null, scheduleDay.id)

  return getScheduleDayViewByDate(date)
}

export function addVendorToDay(date: string, vendorId: string): ScheduleDayView {
  const scheduleDay = ensureScheduleDay(date)
  const db = getDatabase()

  const existing = db
    .prepare(
      `
        SELECT id
        FROM scheduled_vendors
        WHERE schedule_day_id = ?
          AND vendor_id = ?
      `,
    )
    .get(scheduleDay.id, vendorId) as { id: string } | undefined

  if (!existing) {
    const currentMax = db
      .prepare(
        `
          SELECT COALESCE(MAX(sort_order), 0) AS max_sort_order
          FROM scheduled_vendors
          WHERE schedule_day_id = ?
        `,
      )
      .get(scheduleDay.id) as { max_sort_order: number }

    db.prepare(
      `
        INSERT INTO scheduled_vendors (id, schedule_day_id, vendor_id, vendor_note, sort_order)
        VALUES (?, ?, ?, NULL, ?)
      `,
    ).run(randomUUID(), scheduleDay.id, vendorId, currentMax.max_sort_order + 1)
  }

  return getScheduleDayViewByDate(date)
}

export function updateScheduledVendorNote(scheduledVendorId: string, vendorNote: string | null): ScheduleDayView {
  const db = getDatabase()

  const scheduledVendor = db
    .prepare(
      `
        SELECT schedule_day_id
        FROM scheduled_vendors
        WHERE id = ?
      `,
    )
    .get(scheduledVendorId) as { schedule_day_id: string } | undefined

  if (!scheduledVendor) {
    throw new Error(`Scheduled vendor with id "${scheduledVendorId}" was not found.`)
  }

  db.prepare(
    `
      UPDATE scheduled_vendors
      SET vendor_note = ?
      WHERE id = ?
    `,
  ).run(vendorNote?.trim() ? vendorNote.trim() : null, scheduledVendorId)

  const dateRow = db
    .prepare(
      `
        SELECT date
        FROM schedule_days
        WHERE id = ?
      `,
    )
    .get(scheduledVendor.schedule_day_id) as { date: string }

  return getScheduleDayViewByDate(dateRow.date)
}

export function removeVendorFromDay(scheduledVendorId: string): ScheduleDayView {
  const db = getDatabase()

  const row = db
    .prepare(
      `
        SELECT sd.date
        FROM scheduled_vendors sv
        JOIN schedule_days sd ON sd.id = sv.schedule_day_id
        WHERE sv.id = ?
      `,
    )
    .get(scheduledVendorId) as { date: string } | undefined

  if (!row) {
    throw new Error(`Scheduled vendor with id "${scheduledVendorId}" was not found.`)
  }

  db.prepare(
    `
      DELETE FROM scheduled_vendors
      WHERE id = ?
    `,
  ).run(scheduledVendorId)

  return getScheduleDayViewByDate(row.date)
}
