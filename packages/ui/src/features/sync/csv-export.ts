import {
  exportToBitwardenCsvWasm,
  exportToBrowserCsvWasm,
  type Folder,
  type VaultItem,
} from "@gistwarden/domain";

/**
 * Xuất danh sách tài khoản sang tệp CSV của trình duyệt (Chrome, Edge) bằng Rust WASM.
 */
export function exportToBrowserCsv(items: VaultItem[]): string {
  const itemsJson = JSON.stringify(items || []);
  return exportToBrowserCsvWasm(itemsJson);
}

/**
 * Xuất danh sách tài khoản sang tệp CSV của Bitwarden bằng Rust WASM.
 */
export function exportToBitwardenCsv(
  items: VaultItem[],
  folders: Folder[] = [],
): string {
  const itemsJson = JSON.stringify(items || []);
  const foldersJson = JSON.stringify(folders || []);
  return exportToBitwardenCsvWasm(itemsJson, foldersJson);
}
