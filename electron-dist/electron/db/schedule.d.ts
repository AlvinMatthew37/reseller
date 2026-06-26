import type { ScheduleDayView } from '../../shared/desktop-api.js';
export declare function getScheduleDayViewByDate(date: string): ScheduleDayView;
export declare function getWeekSchedule(anchorDate: string): ScheduleDayView[];
export declare function getScheduleRange(startDate: string, endDate: string): ScheduleDayView[];
export declare function upsertDayNote(date: string, generalNote: string | null): ScheduleDayView;
export declare function addVendorToDay(date: string, vendorId: string): ScheduleDayView;
export declare function updateScheduledVendorNote(scheduledVendorId: string, vendorNote: string | null): ScheduleDayView;
export declare function removeVendorFromDay(scheduledVendorId: string): ScheduleDayView;
