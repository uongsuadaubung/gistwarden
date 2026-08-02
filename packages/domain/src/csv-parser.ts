import { parseCsvWasm, unparseCsvWasm } from "./wasm/index.ts";

/**
 * Phân tích cú pháp chuỗi CSV theo chuẩn RFC 4180 ủy quyền 100% cho Rust WebAssembly.
 * Hỗ trợ tất cả các biến thể định dạng CSV (ngoặc kép lồng nhau, xuống dòng, BOM header).
 */
export function parseCSV(text: string): string[][] {
  return parseCsvWasm(text);
}

/**
 * Xuất mảng 2 chiều string[][] thành chuỗi định dạng CSV chuẩn RFC 4180 bằng Rust WASM.
 */
export function unparseCSV(rows: string[][]): string {
  return unparseCsvWasm(rows);
}
