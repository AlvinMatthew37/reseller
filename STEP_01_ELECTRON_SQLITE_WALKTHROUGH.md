# Step 01 Walkthrough - Electron + SQLite Foundation

## Goal
This step turns `Reseller` from a plain Vite web app into the foundation of a desktop app by adding:

- `Electron` as the desktop shell
- `SQLite` as the local database
- a secure `preload` bridge between the renderer and Electron
- the initial database schema for vendors, menus, and schedule data

## What was added

### 1. Electron runtime
- Added Electron scripts to `package.json`
- Added an Electron entry file at `electron/main.ts`
- Added a preload bridge at `electron/preload.ts`

The Electron main process now:
- creates the desktop window
- loads the Vite dev server in development
- loads the built `dist/index.html` file in production
- initializes the SQLite database on app startup

### 2. SQLite database layer
- Added `better-sqlite3`
- Added database schema definitions in `electron/db/schema.ts`
- Added database initialization and bootstrap helpers in `electron/db/client.ts`

The database is created inside Electron's user data folder as:
- `reseller.sqlite`

Current tables:
- `app_meta`
- `vendors`
- `menu_items`
- `schedule_days`
- `scheduled_vendors`

### 3. Shared desktop API types
- Added shared types in `shared/domain.ts`
- Added preload API types in `shared/desktop-api.ts`

This keeps the app ready for future growth by defining:
- vendor status
- menu item status
- core domain entities
- the desktop bridge contract used by the renderer

### 4. Renderer bootstrap check
- Updated `src/App.tsx` to call the preload API
- The app now shows:
  - database path
  - schema version
  - initialization status
  - created table names

This is just a temporary verification screen for the foundation step.

## New commands

### Run the web app only
```bash
npm run dev
```

### Run the desktop app in development
```bash
npm run dev:desktop
```

### Build the renderer and Electron code
```bash
npm run build
```

### Start Electron after build
```bash
npm run start:desktop
```

## Why this step matters
This gives us the correct long-term architecture for your app:

- `React` handles the UI
- `Electron` handles desktop capabilities
- `SQLite` stores local business data
- the preload bridge keeps the renderer isolated from direct Node access

That means the next features can be built on the real foundation instead of temporary browser storage.

## What is intentionally not done yet
This step does **not** include:

- vendor CRUD screens
- calendar interactions
- menu CRUD forms
- backup/export actions
- image file copying workflows

Those come after the foundation is stable.

## Recommended next step
Build the first real data feature:

- vendor master data CRUD

That should include:
- create vendor
- edit vendor
- list vendors
- cooldown vendor status

After that, we can connect vendors into the weekly schedule UI.
