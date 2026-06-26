import type { MenuItem, MenuItemStatus } from '../../shared/domain.js';
import type { MenuItemInput } from '../../shared/desktop-api.js';
export declare function listMenuItemsByVendor(vendorId: string): MenuItem[];
export declare function getMenuItemById(menuItemId: string): MenuItem | null;
export declare function createMenuItem(vendorId: string, input: MenuItemInput): MenuItem;
export declare function updateMenuItem(menuItemId: string, input: MenuItemInput): MenuItem;
export declare function setMenuItemStatus(menuItemId: string, status: MenuItemStatus): MenuItem;
