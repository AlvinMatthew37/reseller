import Database from 'better-sqlite3';
export interface DatabaseBootstrapInfo {
    databasePath: string;
    schemaVersion: number;
    tables: string[];
    isReady: boolean;
}
export declare function initializeDatabase(databasePath: string): Database.Database;
export declare function getDatabase(): Database.Database;
export declare function getDatabaseBootstrapInfo(): DatabaseBootstrapInfo;
