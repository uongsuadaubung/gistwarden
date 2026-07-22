import Papa from "papaparse";

/**
 * Phân tích cú pháp chuỗi CSV theo chuẩn RFC 4180 sử dụng PapaParse.
 * Hỗ trợ tất cả các biến thể định dạng CSV (ngoặc kép lồng nhau, xuống dòng, BOM header).
 */
export function parseCSV(text: string): string[][] {
  if (!text || text.trim() === "") {
    return [];
  }
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });
  return parsed.data;
}
