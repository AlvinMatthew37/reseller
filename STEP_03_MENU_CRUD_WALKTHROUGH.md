# Step 03 Walkthrough - Menu CRUD and Image Upload

## Goal
This step extends each vendor with menu management so the app can store what each vendor actually sells.

It adds:

- menu item CRUD under a vendor
- latest price tracking
- archive/reactivate menu items
- local image upload for menu items

## What was added

### 1. Menu database layer
- Added menu database methods in `electron/db/menus.ts`

Current menu operations:
- list menu items by vendor
- create menu item
- update menu item
- archive/reactivate menu item

Menu fields in this step:
- `name`
- `price`
- `imagePath`
- `status`

### 2. Menu IPC / preload bridge
- Added menu handlers in the Electron main process
- Exposed menu methods to the renderer

Current renderer-facing menu API:
- `menus.listByVendor(vendorId)`
- `menus.create(vendorId, input)`
- `menus.update(menuItemId, input)`
- `menus.setStatus(menuItemId, status)`

### 3. Menu UI inside vendor detail
- Extended `Vendor Detail` so each vendor now owns its menu list
- Added add/edit flows for menu items
- Added archive/reactivate actions

The vendor detail page now acts as:
- vendor editor
- menu management workspace

### 4. Modal-based menu editing
- Moved add/edit menu item flows into popups

This keeps the vendor detail page cleaner by:
- showing the menu list directly
- opening forms only when needed

### 5. Local image upload flow
- Added Electron-side file selection and copying in `electron/files/menu-images.ts`
- Uploaded images are copied into an app-managed folder inside Electron user data
- SQLite stores only the copied local path

Current image flow:
- user clicks upload
- Electron opens file picker
- selected image is copied into app storage
- image path is saved in `SQLite`

### 6. Image preview support
- Added preview support for uploaded menu images
- Menu cards and modal forms now show image previews

This avoids depending on raw path rendering from the renderer directly.

## Why this step matters
This step turns vendors from simple contact records into actual selling units.

Now the app knows:
- which vendor exists
- what each vendor sells
- the latest price for each menu item
- what image belongs to each item

That makes the schedule feature much more useful and more visual.

## What is intentionally not done yet
This step does **not** include:

- order management
- stock/inventory
- cloud image storage
- schedule assignment

Those stay outside the menu step.

## Recommended next step
Build the scheduling/calendar system:

- assign vendors to days
- add general day notes
- add vendor-specific notes
- calculate `baru jual`
