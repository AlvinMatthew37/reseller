import { randomUUID } from 'node:crypto'

import type { Vendor, VendorStatus } from '../../shared/domain.js'
import type { VendorInput } from '../../shared/desktop-api.js'
import { getDatabase } from './client.js'

interface VendorRow {
  id: string
  name: string
  type: string
  location: string
  phone_number: string
  status: VendorStatus
  created_at: string
  updated_at: string
}

function mapVendorRow(row: VendorRow): Vendor {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    location: row.location,
    phoneNumber: row.phone_number,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getVendorOrThrow(vendorId: string) {
  const vendor = getVendorById(vendorId)

  if (!vendor) {
    throw new Error(`Vendor with id "${vendorId}" was not found.`)
  }

  return vendor
}

export function listVendors(): Vendor[] {
  const rows = getDatabase()
    .prepare(
      `
        SELECT id, name, type, location, phone_number, status, created_at, updated_at
        FROM vendors
        ORDER BY name COLLATE NOCASE ASC
      `,
    )
    .all() as VendorRow[]

  return rows.map(mapVendorRow)
}

export function getVendorById(vendorId: string): Vendor | null {
  const row = getDatabase()
    .prepare(
      `
        SELECT id, name, type, location, phone_number, status, created_at, updated_at
        FROM vendors
        WHERE id = ?
      `,
    )
    .get(vendorId) as VendorRow | undefined

  return row ? mapVendorRow(row) : null
}

export function createVendor(input: VendorInput): Vendor {
  const now = new Date().toISOString()
  const vendorId = randomUUID()

  getDatabase()
    .prepare(
      `
        INSERT INTO vendors (id, name, type, location, phone_number, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
      `,
    )
    .run(vendorId, input.name.trim(), input.type.trim(), input.location.trim(), input.phoneNumber.trim(), now, now)

  return getVendorOrThrow(vendorId)
}

export function updateVendor(vendorId: string, input: VendorInput): Vendor {
  const now = new Date().toISOString()

  getVendorOrThrow(vendorId)

  getDatabase()
    .prepare(
      `
        UPDATE vendors
        SET name = ?,
            type = ?,
            location = ?,
            phone_number = ?,
            updated_at = ?
        WHERE id = ?
      `,
    )
    .run(
      input.name.trim(),
      input.type.trim(),
      input.location.trim(),
      input.phoneNumber.trim(),
      now,
      vendorId,
    )

  return getVendorOrThrow(vendorId)
}

export function setVendorStatus(vendorId: string, status: VendorStatus): Vendor {
  const now = new Date().toISOString()

  getVendorOrThrow(vendorId)

  getDatabase()
    .prepare(
      `
        UPDATE vendors
        SET status = ?,
            updated_at = ?
        WHERE id = ?
      `,
    )
    .run(status, now, vendorId)

  return getVendorOrThrow(vendorId)
}
