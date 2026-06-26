# Step 02 Walkthrough - Vendor Master Data CRUD

## Goal
This step adds the first real business feature to `Reseller`:

- create vendors
- edit vendors
- list vendors
- search, filter, and sort vendors
- keep vendor data as stable master data for future scheduling

## What was added

### 1. Vendor database layer
- Added vendor database methods in `electron/db/vendors.ts`

Current vendor operations:
- create vendor
- get vendor by id
- list vendors
- update vendor details

Vendor fields in this step:
- `name`
- `type`
- `location`
- `phoneNumber`

### 2. Vendor IPC / preload bridge
- Added vendor methods to the Electron main process handlers
- Exposed vendor methods to the renderer through preload

Current renderer-facing vendor API:
- `vendors.list()`
- `vendors.getById(vendorId)`
- `vendors.create(input)`
- `vendors.update(vendorId, input)`

### 3. Vendor routes and UI
- Added the `Vendors` page
- Added the `Vendor Detail` page
- Added shared vendor form UI
- Added top-level app shell navigation

This means the app now has:
- a vendor list screen
- a create vendor flow
- an edit vendor flow
- a detail view for each vendor

### 4. Vendor type rules
- Vendor type was later tightened into a controlled dropdown

Current vendor type options:
- `Makanan berat`
- `Makanan ringan`
- `Minuman`
- `Lainnya`

### 5. Search and filtering
The vendor list supports:
- search by vendor name
- filter by vendor type
- sort A-Z / Z-A

## Why this step matters
This step establishes the vendor master data that the rest of the app depends on.

Without stable vendors:
- menu items cannot belong to anything
- the schedule cannot assign vendors to days
- backups and reporting would be inconsistent

This is the foundation for the actual planning workflow.

## What is intentionally not done yet
This step does **not** include:

- menu CRUD
- calendar scheduling
- vendor images
- backup/export

Those come in later steps.

## Recommended next step
Build menu management under each vendor:

- add menu items
- edit latest price
- archive/reactivate menu items
- prepare image handling
