import {
  type VaultField,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
} from "@/core/types.ts";
import { APP_NAME } from "@/core/constants.ts";
import { parseCSV } from "@/core/csv-parser.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeParseUrl } from "@/core/domain-utils.ts";

function extractDomain(urlStr: string): string {
  return safeParseUrl(urlStr).map((u) => u.hostname).unwrapOr(urlStr);
}

/**
 * Phân tích và xác thực file CSV trình duyệt (Chrome, Edge, Firefox).
 * Yêu cầu bắt buộc 3 trường: url, username, password.
 */
export function parseAndValidateBrowserCsv(
  csvString: string,
  existingItems: VaultItem[],
): Result<
  { importedCount: number; combinedItems: VaultItem[] },
  TranslationKey
> {
  console.log(`[${APP_NAME} CSV Import] Bắt đầu đọc file CSV trình duyệt...`);
  const rows = parseCSV(csvString);
  if (rows.length < 2) {
    return err("vault_import_csv_error_fail");
  }

  const headers = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, "")
  );
  const urlIdx = headers.indexOf("url");
  const usernameIdx = headers.indexOf("username");
  const passwordIdx = headers.indexOf("password");
  const nameIdx = headers.indexOf("name");

  let noteIdx = headers.indexOf("note");
  if (noteIdx === -1) {
    noteIdx = headers.indexOf("notes");
  }

  if (urlIdx === -1 || usernameIdx === -1 || passwordIdx === -1) {
    return err("import_error_browser_invalid");
  }

  const now = new Date().toISOString();
  const newVaultItems: VaultItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    const urlVal = row[urlIdx] || "";
    const usernameVal = row[usernameIdx] || "";
    const passwordVal = row[passwordIdx] || "";
    let nameVal = nameIdx !== -1 ? row[nameIdx] : "";
    const noteVal = noteIdx !== -1 ? row[noteIdx] : "";

    if (!urlVal && !usernameVal && !passwordVal) {
      continue;
    }

    if (!nameVal) {
      nameVal = extractDomain(urlVal);
    }

    const uris = urlVal ? [{ uri: urlVal, match: null }] : [];

    newVaultItems.push({
      id: crypto.randomUUID(),
      type: VaultItemType.Login,
      name: nameVal || "Chưa đặt tên login",
      notes: noteVal || "",
      favorite: false,
      reprompt: 0,
      fields: [],
      login: {
        username: usernameVal,
        password: passwordVal,
        totp: "",
        uris,
        fido2Credentials: [],
        passwordRevisionDate: null,
        passwordHistory: [],
      },
      creationDate: now,
      revisionDate: now,
    });
  }

  console.log(`[${APP_NAME} CSV Import] Bắt đầu kiểm tra và lưu...`);
  const combinedItems = [...existingItems, ...newVaultItems];
  const validatedListResult = VaultListSchema.safeParse(combinedItems);
  if (!validatedListResult.success) {
    return err("storage_error");
  }

  return ok({
    importedCount: newVaultItems.length,
    combinedItems: validatedListResult.data,
  });
}

/**
 * Phân tích và xác thực file Bitwarden CSV.
 */
export function parseAndValidateBitwardenCsv(
  csvString: string,
  existingItems: VaultItem[],
): Result<
  { importedCount: number; combinedItems: VaultItem[] },
  TranslationKey
> {
  console.log(`[${APP_NAME} CSV Import] Bắt đầu đọc file Bitwarden CSV...`);
  const rows = parseCSV(csvString);
  if (rows.length < 2) {
    return err("vault_import_csv_error_fail");
  }

  const headers = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, "")
  );

  const typeIdx = headers.indexOf("type");
  const nameIdx = headers.indexOf("name");
  const notesIdx = headers.indexOf("notes");
  const favoriteIdx = headers.indexOf("favorite");
  const repromptIdx = headers.indexOf("reprompt");
  const fieldsIdx = headers.indexOf("fields");
  const uriIdx = headers.indexOf("login_uri");
  const usernameIdx = headers.indexOf("login_username");
  const passwordIdx = headers.indexOf("login_password");
  const totpIdx = headers.indexOf("login_totp");

  if (
    typeIdx === -1 ||
    nameIdx === -1 ||
    (uriIdx === -1 && usernameIdx === -1 && passwordIdx === -1)
  ) {
    return err("import_error_bitwarden_invalid");
  }

  const now = new Date().toISOString();
  const newVaultItems: VaultItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    const typeVal = (row[typeIdx] || "").trim().toLowerCase();
    const nameVal = row[nameIdx] || "";
    const notesVal = notesIdx !== -1 ? row[notesIdx] : "";
    const favoriteVal = favoriteIdx !== -1
      ? (row[favoriteIdx] === "1" || row[favoriteIdx] === "true")
      : false;
    const repromptVal = repromptIdx !== -1
      ? (row[repromptIdx] === "1" || row[repromptIdx] === "true" ? 1 : 0)
      : 0;

    const customFields: VaultField[] = [];
    if (fieldsIdx !== -1 && row[fieldsIdx]) {
      const fieldsStr = row[fieldsIdx];
      const lines = fieldsStr.split(/\r?\n/);
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          customFields.push({
            name: line.slice(0, colonIdx).trim(),
            value: line.slice(colonIdx + 1).trim(),
            type: 0,
          });
        }
      }
    }

    if (typeVal === "note" || typeVal === "securenote") {
      newVaultItems.push({
        id: crypto.randomUUID(),
        type: VaultItemType.SecureNote,
        name: nameVal || "Chưa đặt tên note",
        notes: notesVal || "",
        favorite: favoriteVal,
        reprompt: repromptVal,
        fields: customFields,
        creationDate: now,
        revisionDate: now,
      });
    } else {
      const uriVal = uriIdx !== -1 ? row[uriIdx] : "";
      const usernameVal = usernameIdx !== -1 ? row[usernameIdx] : "";
      const passwordVal = passwordIdx !== -1 ? row[passwordIdx] : "";
      const totpVal = totpIdx !== -1 ? row[totpIdx] : "";

      const uris = uriVal ? [{ uri: uriVal, match: null }] : [];

      newVaultItems.push({
        id: crypto.randomUUID(),
        type: VaultItemType.Login,
        name: nameVal || extractDomain(uriVal) || "Chưa đặt tên login",
        notes: notesVal || "",
        favorite: favoriteVal,
        reprompt: repromptVal,
        fields: customFields,
        login: {
          username: usernameVal,
          password: passwordVal,
          totp: totpVal,
          uris,
          fido2Credentials: [],
          passwordRevisionDate: null,
          passwordHistory: [],
        },
        creationDate: now,
        revisionDate: now,
      });
    }
  }

  console.log(`[${APP_NAME} CSV Import] Bắt đầu kiểm tra và lưu...`);
  const combinedItems = [...existingItems, ...newVaultItems];
  const validatedListResult = VaultListSchema.safeParse(combinedItems);
  if (!validatedListResult.success) {
    return err("storage_error");
  }

  return ok({
    importedCount: newVaultItems.length,
    combinedItems: validatedListResult.data,
  });
}
