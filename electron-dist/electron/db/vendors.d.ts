import type { Vendor, VendorStatus } from '../../shared/domain.js';
import type { VendorInput } from '../../shared/desktop-api.js';
export declare function listVendors(): Vendor[];
export declare function getVendorById(vendorId: string): Vendor | null;
export declare function createVendor(input: VendorInput): Vendor;
export declare function updateVendor(vendorId: string, input: VendorInput): Vendor;
export declare function setVendorStatus(vendorId: string, status: VendorStatus): Vendor;
