/**
 * Phân tích cú pháp chuỗi CSV theo chuẩn RFC 4180.
 * Hỗ trợ các trường chứa dấu ngoặc kép lồng nhau, dấu phẩy và xuống dòng.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Bỏ qua dấu ngoặc kép tiếp theo
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\r" || char === "\n") {
        row.push(cell);
        cell = "";
        // Bỏ qua dòng trống
        if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
          result.push(row);
        }
        row = [];
        if (char === "\r" && nextChar === "\n") {
          i++; // Bỏ qua \n nếu là \r\n
        }
      } else {
        cell += char;
      }
    }
  }

  // Xử lý dòng cuối cùng nếu không có ký tự xuống dòng ở cuối
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
      result.push(row);
    }
  }

  return result;
}
