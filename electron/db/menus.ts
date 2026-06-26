import { randomUUID } from 'node:crypto'

import type { MenuItem, MenuItemStatus } from '../../shared/domain.js'
import type { MenuItemInput } from '../../shared/desktop-api.js'
import { getDatabase } from './client.js'

interface MenuItemRow {
  id: string
  vendor_id: string
  name: string
  price: number
  image_path: string | null
  status: MenuItemStatus
  created_at: string
  updated_at: string
}

function mapMenuItemRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    name: row.name,
    price: row.price,
    imagePath: row.image_path,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getMenuItemOrThrow(menuItemId: string) {
  const menuItem = getMenuItemById(menuItemId)

  if (!menuItem) {
    throw new Error(`Menu item with id "${menuItemId}" was not found.`)
  }

  return menuItem
}

function normalizeMenuItemInput(input: MenuItemInput): MenuItemInput {
  return {
    name: input.name.trim(),
    price: Number(input.price),
    imagePath: input.imagePath?.trim() ? input.imagePath.trim() : null,
  }
}

export function listMenuItemsByVendor(vendorId: string): MenuItem[] {
  const rows = getDatabase()
    .prepare(
      `
        SELECT id, vendor_id, name, price, image_path, status, created_at, updated_at
        FROM menu_items
        WHERE vendor_id = ?
        ORDER BY
          CASE WHEN status = 'active' THEN 0 ELSE 1 END,
          name COLLATE NOCASE ASC
      `,
    )
    .all(vendorId) as MenuItemRow[]

  return rows.map(mapMenuItemRow)
}

export function getMenuItemById(menuItemId: string): MenuItem | null {
  const row = getDatabase()
    .prepare(
      `
        SELECT id, vendor_id, name, price, image_path, status, created_at, updated_at
        FROM menu_items
        WHERE id = ?
      `,
    )
    .get(menuItemId) as MenuItemRow | undefined

  return row ? mapMenuItemRow(row) : null
}

export function createMenuItem(vendorId: string, input: MenuItemInput): MenuItem {
  const normalizedInput = normalizeMenuItemInput(input)
  const menuItemId = randomUUID()
  const now = new Date().toISOString()

  getDatabase()
    .prepare(
      `
        INSERT INTO menu_items (id, vendor_id, name, price, image_path, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
      `,
    )
    .run(
      menuItemId,
      vendorId,
      normalizedInput.name,
      normalizedInput.price,
      normalizedInput.imagePath,
      now,
      now,
    )

  return getMenuItemOrThrow(menuItemId)
}

export function updateMenuItem(menuItemId: string, input: MenuItemInput): MenuItem {
  const normalizedInput = normalizeMenuItemInput(input)
  const now = new Date().toISOString()

  getMenuItemOrThrow(menuItemId)

  getDatabase()
    .prepare(
      `
        UPDATE menu_items
        SET name = ?,
            price = ?,
            image_path = ?,
            updated_at = ?
        WHERE id = ?
      `,
    )
    .run(
      normalizedInput.name,
      normalizedInput.price,
      normalizedInput.imagePath,
      now,
      menuItemId,
    )

  return getMenuItemOrThrow(menuItemId)
}

export function setMenuItemStatus(menuItemId: string, status: MenuItemStatus): MenuItem {
  const now = new Date().toISOString()

  getMenuItemOrThrow(menuItemId)

  getDatabase()
    .prepare(
      `
        UPDATE menu_items
        SET status = ?,
            updated_at = ?
        WHERE id = ?
      `,
    )
    .run(status, now, menuItemId)

  return getMenuItemOrThrow(menuItemId)
}
