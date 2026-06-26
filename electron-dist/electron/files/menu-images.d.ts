import { type BrowserWindow } from 'electron';
export declare function getMenuImagesDirectory(): string;
export declare function selectAndImportMenuImage(browserWindow: BrowserWindow): Promise<string | null>;
export declare function writeImportedMenuImage(fileName: string, base64Data: string): string;
export declare function getMenuImagePreviewUrl(imagePath: string): string | null;
