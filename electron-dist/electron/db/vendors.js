import { randomUUID } from 'node:crypto';
import { getDatabase } from './client.js';
function mapVendorRow(row) {
    return {
        id: row.id,
        name: row.name,
        type: row.type,
        location: row.location,
        phoneNumber: row.phone_number,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function getVendorOrThrow(vendorId) {
    const vendor = getVendorById(vendorId);
    if (!vendor) {
        throw new Error(`Vendor with id "${vendorId}" was not found.`);
    }
    return vendor;
}
export function listVendors() {
    const rows = getDatabase()
        .prepare(`
        SELECT id, name, type, location, phone_number, status, created_at, updated_at
        FROM vendors
        ORDER BY name COLLATE NOCASE ASC
      `)
        .all();
    return rows.map(mapVendorRow);
}
export function getVendorById(vendorId) {
    const row = getDatabase()
        .prepare(`
        SELECT id, name, type, location, phone_number, status, created_at, updated_at
        FROM vendors
        WHERE id = ?
      `)
        .get(vendorId);
    return row ? mapVendorRow(row) : null;
}
export function createVendor(input) {
    const now = new Date().toISOString();
    const vendorId = randomUUID();
    getDatabase()
        .prepare(`
        INSERT INTO vendors (id, name, type, location, phone_number, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
      `)
        .run(vendorId, input.name.trim(), input.type.trim(), input.location.trim(), input.phoneNumber.trim(), now, now);
    return getVendorOrThrow(vendorId);
}
export function updateVendor(vendorId, input) {
    const now = new Date().toISOString();
    getVendorOrThrow(vendorId);
    getDatabase()
        .prepare(`
        UPDATE vendors
        SET name = ?,
            type = ?,
            location = ?,
            phone_number = ?,
            updated_at = ?
        WHERE id = ?
      `)
        .run(input.name.trim(), input.type.trim(), input.location.trim(), input.phoneNumber.trim(), now, vendorId);
    return getVendorOrThrow(vendorId);
}
export function setVendorStatus(vendorId, status) {
    const now = new Date().toISOString();
    getVendorOrThrow(vendorId);
    getDatabase()
        .prepare(`
        UPDATE vendors
        SET status = ?,
            updated_at = ?
        WHERE id = ?
      `)
        .run(status, now, vendorId);
    return getVendorOrThrow(vendorId);
}
