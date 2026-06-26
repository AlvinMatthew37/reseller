import { randomUUID } from 'node:crypto';
import { getDatabase } from './client.js';
function mapMenuItemRow(row) {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        name: row.name,
        description: row.description,
        price: row.price,
        imagePath: row.image_path,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function getMenuItemOrThrow(menuItemId) {
    const menuItem = getMenuItemById(menuItemId);
    if (!menuItem) {
        throw new Error(`Menu item with id "${menuItemId}" was not found.`);
    }
    return menuItem;
}
function normalizeMenuItemInput(input) {
    return {
        name: input.name.trim(),
        description: input.description.trim(),
        price: Number(input.price),
        imagePath: input.imagePath?.trim() ? input.imagePath.trim() : null,
    };
}
export function listMenuItemsByVendor(vendorId) {
    const rows = getDatabase()
        .prepare(`
        SELECT id, vendor_id, name, description, price, image_path, status, created_at, updated_at
        FROM menu_items
        WHERE vendor_id = ?
        ORDER BY
          CASE WHEN status = 'active' THEN 0 ELSE 1 END,
          name COLLATE NOCASE ASC
      `)
        .all(vendorId);
    return rows.map(mapMenuItemRow);
}
export function getMenuItemById(menuItemId) {
    const row = getDatabase()
        .prepare(`
        SELECT id, vendor_id, name, description, price, image_path, status, created_at, updated_at
        FROM menu_items
        WHERE id = ?
      `)
        .get(menuItemId);
    return row ? mapMenuItemRow(row) : null;
}
export function createMenuItem(vendorId, input) {
    const normalizedInput = normalizeMenuItemInput(input);
    const menuItemId = randomUUID();
    const now = new Date().toISOString();
    getDatabase()
        .prepare(`
        INSERT INTO menu_items (id, vendor_id, name, description, price, image_path, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `)
        .run(menuItemId, vendorId, normalizedInput.name, normalizedInput.description, normalizedInput.price, normalizedInput.imagePath, now, now);
    return getMenuItemOrThrow(menuItemId);
}
export function updateMenuItem(menuItemId, input) {
    const normalizedInput = normalizeMenuItemInput(input);
    const now = new Date().toISOString();
    getMenuItemOrThrow(menuItemId);
    getDatabase()
        .prepare(`
        UPDATE menu_items
        SET name = ?,
            description = ?,
            price = ?,
            image_path = ?,
            updated_at = ?
        WHERE id = ?
      `)
        .run(normalizedInput.name, normalizedInput.description, normalizedInput.price, normalizedInput.imagePath, now, menuItemId);
    return getMenuItemOrThrow(menuItemId);
}
export function setMenuItemStatus(menuItemId, status) {
    const now = new Date().toISOString();
    getMenuItemOrThrow(menuItemId);
    getDatabase()
        .prepare(`
        UPDATE menu_items
        SET status = ?,
            updated_at = ?
        WHERE id = ?
      `)
        .run(status, now, menuItemId);
    return getMenuItemOrThrow(menuItemId);
}
