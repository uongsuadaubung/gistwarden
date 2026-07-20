import { type VaultItem, VaultItemType } from "@/core/types.ts";

/**
 * Chuẩn hóa một ô dữ liệu CSV theo chuẩn RFC 4180
 */
export function escapeCSVCell(val: string): string {
  if (!val) return "";
  const needsQuotes = val.includes(",") || val.includes('"') ||
    val.includes("\n") || val.includes("\r");
  let escaped = val;
  if (val.includes('"')) {
    escaped = val.replaceAll('"', '""');
  }
  return needsQuotes ? `"${escaped}"` : escaped;
}

/**
 * Xuất danh sách tài khoản sang tệp CSV của trình duyệt (Chrome, Edge).
 * Chỉ xuất các mục thuộc kiểu VaultItemType.Login.
 */
export function exportToBrowserCsv(items: VaultItem[]): string {
  const headers = ["name", "url", "username", "password", "note"];
  const lines = [headers.join(",")];

  for (const item of items) {
    if (item.type === VaultItemType.Login) {
      const uri = item.login.uris?.[0]?.uri || "";
      const username = item.login.username || "";
      const password = item.login.password || "";
      const row = [
        escapeCSVCell(item.name),
        escapeCSVCell(uri),
        escapeCSVCell(username),
        escapeCSVCell(password),
        escapeCSVCell(item.notes || ""),
      ];
      lines.push(row.join(","));
    }
  }

  return lines.join("\n");
}

/**
 * Xuất danh sách tài khoản sang tệp CSV của Bitwarden.
 * Xuất các mục Đăng nhập (type=login) và Ghi chú bảo mật (type=note).
 */
export function exportToBitwardenCsv(items: VaultItem[]): string {
  const headers = [
    "folder",
    "favorite",
    "type",
    "name",
    "notes",
    "fields",
    "reprompt",
    "login_uri",
    "login_username",
    "login_password",
    "login_totp",
  ];
  const lines = [headers.join(",")];

  for (const item of items) {
    if (
      item.type === VaultItemType.Login ||
      item.type === VaultItemType.SecureNote
    ) {
      const typeStr = item.type === VaultItemType.Login ? "login" : "note";
      const favoriteStr = item.favorite ? "1" : "0";
      const repromptStr = item.reprompt ? "1" : "0";

      const fieldsStr = item.fields
        ? item.fields.map((f) => `${f.name || ""}:${f.value || ""}`).join("\n")
        : "";

      let uri = "";
      let username = "";
      let password = "";
      let totp = "";

      if (item.type === VaultItemType.Login) {
        uri = item.login.uris?.[0]?.uri || "";
        username = item.login.username || "";
        password = item.login.password || "";
        totp = item.login.totp || "";
      }

      const row = [
        "", // folder
        favoriteStr,
        typeStr,
        escapeCSVCell(item.name),
        escapeCSVCell(item.notes || ""),
        escapeCSVCell(fieldsStr),
        repromptStr,
        escapeCSVCell(uri),
        escapeCSVCell(username),
        escapeCSVCell(password),
        escapeCSVCell(totp),
      ];
      lines.push(row.join(","));
    }
  }

  return lines.join("\n");
}
