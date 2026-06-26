import { type BrowserWindow } from 'electron';
type BackupOperationResult = {
    filePath: string;
    counts: {
        vendors: number;
        menuItems: number;
        scheduleDays: number;
        scheduledVendors: number;
    };
};
type BackupRestoreResult = BackupOperationResult & {
    importedAt: string;
};
export declare function exportJsonBackup(browserWindow: BrowserWindow | null): Promise<BackupOperationResult | null>;
export declare function importJsonBackup(browserWindow: BrowserWindow | null): Promise<BackupRestoreResult | null>;
export declare function exportVendorsCsv(browserWindow: BrowserWindow | null): Promise<BackupOperationResult | null>;
export declare function exportMenusCsv(browserWindow: BrowserWindow | null): Promise<BackupOperationResult | null>;
export declare function getBackupImageDirectory(): string;
export {};
