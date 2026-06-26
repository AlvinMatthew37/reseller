# Step 05 Walkthrough - Backup, Restore, and CSV Export

## Goal
This step gives the app a safe way to protect data and move it out of the desktop app.

It adds:

- full JSON backup export
- JSON restore with confirmation
- CSV export for vendors
- CSV export for menu items
- bundled menu image data inside JSON backups

## What was added

### 1. Backup data layer
- Added a backup module in `electron/db/backup.ts`

Current backup operations:
- export a full JSON backup
- import a full JSON backup
- export vendors to CSV
- export menu items to CSV

Backup JSON now includes:
- app meta rows
- vendors
- menu items
- schedule days
- scheduled vendors
- menu image data, when a menu item has an image

### 2. Restore flow
- Restoring a JSON backup replaces the current local data set
- The app asks for confirmation before restoring
- Restore runs in a single database transaction

Restore behavior:
- clears existing app tables
- restores vendors first
- restores schedule days and scheduled vendors
- restores menu items
- recreates saved menu images in the app data folder

### 3. CSV export
- Added CSV export for quick spreadsheet usage

Current CSV exports:
- vendors CSV
- menu items CSV

These exports are text-only snapshots and do not include embedded image data.

### 4. Renderer controls
- Added a tiny document-icon backup trigger in the main header

Current UI actions:
- a small document icon button opens a popup menu
- the popup contains:
  - `Export JSON backup`
  - `Import JSON backup`
  - `Export vendors CSV`
  - `Export menus CSV`

The header popup gives the app a compact desktop-app feel and keeps the calendar page wide and uncluttered.

## Why this step matters
This gives the app a practical safety net before we move into the more advanced business workflows.

It means the family can:

- keep a full offline backup of the app state
- restore data if the laptop resets or the database is lost
- share vendor/menu snapshots with Excel or other tools

## What is intentionally not done yet
This step does **not** include:

- order management
- automatic cloud sync
- role-based access
- audit history for changes

Those can come later.

## Recommended next step
Build order management:

- create a simple order intake flow
- link orders to scheduled vendors
- store order status and totals
- later, connect orders back to daily schedule planning
