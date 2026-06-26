# Reseller MVP Implementation Plan

## Summary
Build `Reseller` as an **Electron-first desktop app** using `React + TypeScript + Tailwind` for the UI and `SQLite` for local persistence. The MVP centers the **weekly calendar/schedule view on the main page**, with supporting vendor master data, menu management, day/vendor notes, and backup/export.

## Key Changes
- **App architecture**
  - Add an Electron shell with a secure preload bridge; keep `React` as the renderer UI.
  - Make `/` the **Schedule** page; supporting routes are `Vendors` and `Vendor Detail`.
  - Keep database access in the Electron side, not directly in the renderer.
  - Expose a narrow API from preload for vendor, menu, schedule, and backup operations.

- **Persistence and data model**
  - Add `SQLite` as the primary local database from the start.
  - Persist these entities:
    - `Vendor`: `id`, `name`, `type`, `location`, `phoneNumber`, `status`, `createdAt`, `updatedAt`
    - `MenuItem`: `id`, `vendorId`, `name`, `price`, `imagePath`, `status`, `createdAt`, `updatedAt`
    - `ScheduleDay`: `id`, `date`, `generalNote`
    - `ScheduledVendor`: `id`, `scheduleDayId`, `vendorId`, `vendorNote`, `sortOrder`
  - Treat vendors and menus as master data; do not hard-delete them in normal flows.
  - Use `status` to support cooldown/archive behavior while preserving history.
  - Store menu images as app-managed files referenced by `imagePath`.

- **Feature behavior**
  - **Schedule as homepage**
    - Use a calendar-first schedule page as the main page.
    - The week view is Monday to Sunday, and the month view is Monday to Sunday as well.
    - Each day can contain multiple vendors, typically 2 to 3 but with no hard limit.
    - Each day has one `generalNote`.
    - Each scheduled vendor can have one `vendorNote`.
    - Clicking a scheduled vendor reveals its details.
  - **Vendor management**
    - Vendor list supports search by name, filter by vendor type, and alphabetical sorting.
    - Vendor detail supports editing vendor info plus menu CRUD.
    - Menu items support latest price only and optional image attachment from the computer.
  - **Backup/export**
    - Full backup/restore uses `JSON`.
    - Convenience export uses `CSV` for at least vendors and menu items.

- **Public interfaces / types**
  - `VendorStatus = "active" | "cooldown"`
  - `MenuItemStatus = "active" | "archived"`
  - Preload-exposed API groups:
    - `vendors`: list, create, update, setStatus
    - `menus`: listByVendor, create, update, setStatus
    - `schedule`: getWeek, upsertDayNote, addVendorToDay, updateVendorNote, removeVendorFromDay
    - `backup`: exportJson, importJson, exportVendorsCsv, exportMenusCsv
  - Renderer types mirror the SQLite row shapes, with view helpers for weekly grouping.

## Build Order
1. Add Electron and wire the desktop app startup flow.
2. Add SQLite and define the initial schema plus database access layer.
3. Add preload IPC APIs for vendors, menus, schedule, and backup.
4. Make the main route the schedule calendar board.
5. Build vendor list and vendor detail screens against the real database.
6. Connect schedule actions to vendor selection and note editing.
7. Add JSON backup/restore and CSV export.

## Test Plan
- Start Electron in development and confirm renderer-to-database calls work through preload only.
- Create, edit, and cooldown vendors while preserving old schedule references.
- Add, edit, and archive menu items with latest price and image path.
- Create a week schedule, add vendors to multiple days, and edit both general and vendor-specific notes.
- Verify Monday-first week layout, Monday-first month layout, and today highlighting.
- Export and re-import JSON with relationships intact.
- Export vendors and menu items to CSV with complete columns.

## Assumptions and Defaults
- The app is now **desktop-first**, not web-first.
- The main landing page is the **schedule calendar view**.
- `SQLite` is the source of truth from the beginning.
- Vendors remain permanent master data; removal is modeled through status, not deletion.
- UI copy remains **English** for the MVP unless changed later.
