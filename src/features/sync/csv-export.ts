import Papa from "papaparse";
import { type VaultItem, VaultItemType } from "@/core/types.ts";

/**
 * Xuất danh sách tài khoản sang tệp CSV của trình duyệt (Chrome, Edge).
 * Chỉ xuất các mục thuộc kiểu VaultItemType.Login.
 */
export function exportToBrowserCsv(items: VaultItem[]): string {
  const rows: string[][] = [
    ["name", "url", "username", "password", "note"],
  ];

  for (const item of items) {
    if (item.type === VaultItemType.Login) {
      const uri = item.login.uris?.[0]?.uri || "";
      const username = item.login.username || "";
      const password = item.login.password || "";
      rows.push([
        item.name || "",
        uri,
        username,
        password,
        item.notes || "",
      ]);
    }
  }

  return Papa.unparse(rows);
}

/**
 * Xuất danh sách tài khoản sang tệp CSV của Bitwarden.
 * Xuất các mục Đăng nhập (type=login) và Ghi chú bảo mật (type=note).
 */
export function exportToBitwardenCsv(items: VaultItem[]): string {
  const rows: string[][] = [
    [
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
    ],
  ];

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

      rows.push([
        "", // folder
        favoriteStr,
        typeStr,
        item.name || "",
        item.notes || "",
        fieldsStr,
        repromptStr,
        uri,
        username,
        password,
        totp,
      ]);
    }
  }

  return Papa.unparse(rows);
}
