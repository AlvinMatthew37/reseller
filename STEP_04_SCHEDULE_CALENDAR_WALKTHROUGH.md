# Step 04 Walkthrough - Weekly and Monthly Schedule Calendar

## Goal
This step turns the schedule into the main workflow of the app.

It adds:

- week view
- month view
- day detail popup
- vendor assignment per day
- general notes per day
- vendor-specific notes per scheduled vendor
- automatic `baru jual` flag calculation
- today highlighting in both views
- Monday-first week layout with a wider calendar canvas

## What was added

### 1. Schedule database layer
- Added schedule data logic in `electron/db/schedule.ts`

Current schedule operations:
- get week schedule
- get date range schedule
- create/update day note
- add vendor to day
- update vendor note
- remove vendor from day

Core schedule entities already existed in the schema:
- `schedule_days`
- `scheduled_vendors`

### 2. Schedule IPC / preload bridge
- Added schedule handlers in Electron main
- Exposed schedule methods to the renderer

Current renderer-facing schedule API:
- `schedule.getWeek(anchorDate)`
- `schedule.getRange(startDate, endDate)`
- `schedule.upsertDayNote(date, generalNote)`
- `schedule.addVendorToDay({ date, vendorId })`
- `schedule.updateVendorNote(scheduledVendorId, vendorNote)`
- `schedule.removeVendorFromDay(scheduledVendorId)`

### 3. Calendar views
- Rebuilt the schedule page into a true calendar-style interface

Current views:
- `Week`
- `Month`

Week view behavior:
- Monday to Sunday, left to right
- each day shown as a larger card
- day name appears on the first line
- month and date appear on the second line
- the active day is highlighted with a stronger accent

Month view behavior:
- Monday to Sunday grid
- whole month visible in calendar form
- Sunday remains visible for context
- the current day is highlighted so it is easy to spot
- weekday labels and date cells now use the same local-date logic, so the badge positions stay correct

### 4. Day detail popup
- Clicking a day cell opens a popup day view
- That popup becomes the main place to manage the selected day

Inside the popup, users can:
- add vendors to the day
- remove vendors from the day
- edit the general day note
- edit vendor-specific notes

This makes the schedule feel closer to a real calendar workflow, similar to Outlook-style interaction.

### 5. Vendor picker popup
- Added a vendor picker modal for assigning vendors to a selected day

The picker supports:
- vendor search
- vendor type filter
- preventing duplicate assignment on the same day

### 6. Automatic `baru jual` logic
- `Baru jual` is not manually set
- It is derived automatically from scheduling data

Current logic:
- if a vendor is scheduled for a date,
- that vendor is treated as `baru jual`
- starting 1 day before that scheduled date
- until 7 days after that date

This matches the earlier product rule that a vendor scheduled for tomorrow should already be marked.

### 7. Local date handling
- The calendar logic now uses local `YYYY-MM-DD` date handling on both the renderer and Electron sides.
- This avoids timezone drift where Sunday badges or weekday labels could slip into the wrong column.
- Week navigation now advances exactly 7 days at a time.
- Month navigation now advances one month at a time.

## Why this step matters
This is the point where the app becomes the actual planning tool for your parents.

Before this step, the app stored:
- vendor data
- menu data

After this step, the app also supports:
- deciding who sells on which day
- seeing the week/month in calendar form
- managing reminders and vendor notes in context

## What is intentionally not done yet
This step does **not** include:

- backup/export/import
- order management
- finance/reporting
- customer-facing workflows

Those remain future phases.

## Recommended next step
Add backup/export/import:

- JSON backup/restore for full app state
- CSV export for vendors/menu data
- restore validation and confirmation flow
