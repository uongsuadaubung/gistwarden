import {
  type ImportItem,
  ImportItemSchema,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
} from "./types.ts";
import { APP_NAME } from "./constants.ts";
import { parseCSV } from "./csv-parser.ts";

/**
 * Phân tích và xác thực nội dung chuỗi JSON nhập từ tệp ({APP_NAME} hoặc Bitwarden xuất ra).
 * Trả về danh sách VaultItem[] đã kết hợp với các mục hiện có.
 */
export function parseAndValidateImportJson(
  jsonString: string,
  existingItems: VaultItem[],
): { success: true; importedCount: number; combinedItems: VaultItem[] } | {
  success: false;
  error: string;
} {
  try {
    console.log(`[${APP_NAME} Import] Bắt đầu đọc file JSON...`);
    const parsed = JSON.parse(jsonString);
    const itemsToImport: ImportItem[] = [];

    // Extract raw items list
    let rawItems: unknown[] = [];
    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (
      parsed && typeof parsed === "object" && Array.isArray(parsed.items)
    ) {
      rawItems = parsed.items;
    } else {
      throw new Error("Định dạng JSON không hợp lệ hoặc không được hỗ trợ");
    }

    // Validate and parse supported items individually using the existing ImportItemSchema
    for (const rawItem of rawItems) {
      const parseResult = ImportItemSchema.safeParse(rawItem);
      if (parseResult.success) {
        itemsToImport.push(parseResult.data);
      } else {
        console.warn(
          `[${APP_NAME} Import] Bỏ qua item không hỗ trợ hoặc lỗi định dạng:`,
          parseResult.error.issues,
        );
      }
    }

    console.log(
      `[${APP_NAME} Import] Kiểm tra xong! Có ${itemsToImport.length} tài khoản hợp lệ cần import.`,
    );

    const now = new Date().toISOString();
    const newVaultItems: VaultItem[] = itemsToImport.map((item, index) => {
      const isLogin = item.type === VaultItemType.Login;
      const loginData = isLogin ? item.login : undefined;
      const rawFido = loginData?.fido2Credentials;
      console.log(
        `[${APP_NAME} Import] Tài khoản thứ ${index + 1} ("${item.name}"):`,
        {
          hasLogin: !!loginData,
          rawFidoCredentialsCount: rawFido?.length || 0,
          rawFidoData: rawFido,
        },
      );

      if (item.type === VaultItemType.SecureNote) {
        return {
          id: crypto.randomUUID(),
          type: VaultItemType.SecureNote,
          name: item.name || "Chưa đặt tên note",
          notes: item.notes || "",
          favorite: item.favorite || false,
          reprompt: item.reprompt,
          fields: item.fields
            ? item.fields.map((f) => ({
              name: f.name || "",
              value: f.value || "",
              type: f.type || 0,
            }))
            : [],
          creationDate: now,
          revisionDate: now,
        };
      } else if (item.type === VaultItemType.Card) {
        const cardData = item.card || {};
        return {
          id: crypto.randomUUID(),
          type: VaultItemType.Card,
          name: item.name || "Chưa đặt tên card",
          notes: item.notes || "",
          favorite: item.favorite || false,
          reprompt: item.reprompt,
          fields: item.fields
            ? item.fields.map((f) => ({
              name: f.name || "",
              value: f.value || "",
              type: f.type || 0,
            }))
            : [],
          card: {
            cardholderName: cardData.cardholderName || "",
            brand: cardData.brand || "",
            number: cardData.number || "",
            expMonth: cardData.expMonth || "",
            expYear: cardData.expYear || "",
            code: cardData.code || "",
          },
          creationDate: now,
          revisionDate: now,
        };
      } else if (item.type === VaultItemType.Identity) {
        const identityData = item.identity || {};
        return {
          id: crypto.randomUUID(),
          type: VaultItemType.Identity,
          name: item.name || "Chưa đặt tên danh tính",
          notes: item.notes || "",
          favorite: item.favorite || false,
          reprompt: item.reprompt,
          fields: item.fields
            ? item.fields.map((f) => ({
              name: f.name || "",
              value: f.value || "",
              type: f.type || 0,
            }))
            : [],
          identity: {
            title: identityData.title || "",
            firstName: identityData.firstName || "",
            middleName: identityData.middleName || "",
            lastName: identityData.lastName || "",
            username: identityData.username || "",
            company: identityData.company || "",
            ssn: identityData.ssn || "",
            passportNumber: identityData.passportNumber || "",
            licenseNumber: identityData.licenseNumber || "",
            email: identityData.email || "",
            phone: identityData.phone || "",
            address1: identityData.address1 || "",
            address2: identityData.address2 || "",
            address3: identityData.address3 || "",
            city: identityData.city || "",
            state: identityData.state || "",
            postalCode: identityData.postalCode || "",
            country: identityData.country || "",
          },
          creationDate: now,
          revisionDate: now,
        };
      } else if (item.type === VaultItemType.SshKey) {
        const sshKeyData = item.sshKey || {};
        return {
          id: crypto.randomUUID(),
          type: VaultItemType.SshKey,
          name: item.name || "Chưa đặt tên SSH Key",
          notes: item.notes || "",
          favorite: item.favorite || false,
          reprompt: item.reprompt,
          fields: item.fields
            ? item.fields.map((f) => ({
              name: f.name || "",
              value: f.value || "",
              type: f.type || 0,
            }))
            : [],
          sshKey: {
            privateKey: sshKeyData.privateKey || "",
            publicKey: sshKeyData.publicKey || "",
            keyFingerprint: sshKeyData.keyFingerprint || "",
          },
          creationDate: now,
          revisionDate: now,
        };
      } else {
        // Login
        const loginData = item.login || {};
        return {
          id: crypto.randomUUID(),
          type: VaultItemType.Login,
          name: item.name || "Chưa đặt tên login",
          notes: item.notes || "",
          favorite: item.favorite || false,
          reprompt: item.reprompt,
          fields: item.fields
            ? item.fields.map((f) => ({
              name: f.name || "",
              value: f.value || "",
              type: f.type || 0,
            }))
            : [],
          login: {
            username: loginData.username || "",
            password: loginData.password || "",
            totp: loginData.totp || "",
            uris: loginData.uris
              ? loginData.uris.map((u) => ({
                uri: u.uri || "",
                match: typeof u.match === "number" ? u.match : null,
              }))
              : [],
            fido2Credentials: loginData.fido2Credentials || [],
            passwordRevisionDate: loginData.passwordRevisionDate || null,
            passwordHistory: loginData.passwordHistory
              ? loginData.passwordHistory.map((ph) => ({
                lastUsedDate: ph.lastUsedDate || null,
                password: ph.password || "",
              }))
              : [],
          },
          creationDate: now,
          revisionDate: now,
        };
      }
    });

    console.log(
      `[${APP_NAME} Import] Bắt đầu kiểm tra và lưu vào danh sách chung...`,
    );
    const combinedItems = [...existingItems, ...newVaultItems];
    const validatedList = VaultListSchema.parse(combinedItems);

    console.log(`[${APP_NAME} Import] Kiểm tra Zod thành công!`);
    return {
      success: true,
      importedCount: newVaultItems.length,
      combinedItems: validatedList,
    };
  } catch (err) {
    console.error(`[${APP_NAME} Import] Lỗi import:`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Lỗi nhập file JSON" };
  }
}

/**
 * Trích xuất tên miền/hostname từ chuỗi URL
 */
function extractDomain(urlStr: string): string {
  try {
    if (!urlStr) return "Chưa đặt tên login";
    if (urlStr.startsWith("chrome://")) {
      return urlStr.replace("chrome://", "");
    }
    const matches = urlStr.match(/^(?:https?:\/\/)?(?:www\.)?([^\/:]+)/i);
    return matches && matches[1] ? matches[1] : urlStr;
  } catch {
    return urlStr;
  }
}

/**
 * Phân tích và xác thực file CSV trình duyệt (Chrome, Edge, Firefox).
 * Yêu cầu bắt buộc 3 trường: url, username, password.
 */
export function parseAndValidateBrowserCsv(
  csvString: string,
  existingItems: VaultItem[],
): { success: true; importedCount: number; combinedItems: VaultItem[] } | {
  success: false;
  error: string;
} {
  try {
    console.log(`[${APP_NAME} CSV Import] Bắt đầu đọc file CSV trình duyệt...`);
    const rows = parseCSV(csvString);
    if (rows.length < 2) {
      throw new Error("File CSV trống hoặc không hợp lệ");
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
      throw new Error(
        "File CSV thiếu các cột bắt buộc: url, username, password.",
      );
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
    const validatedList = VaultListSchema.parse(combinedItems);

    return {
      success: true,
      importedCount: newVaultItems.length,
      combinedItems: validatedList,
    };
  } catch (err) {
    console.error(`[${APP_NAME} CSV Import] Lỗi:`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  }
}

/**
 * Phân tích và xác thực file Bitwarden CSV.
 */
export function parseAndValidateBitwardenCsv(
  csvString: string,
  existingItems: VaultItem[],
): { success: true; importedCount: number; combinedItems: VaultItem[] } | {
  success: false;
  error: string;
} {
  try {
    console.log(`[${APP_NAME} CSV Import] Bắt đầu đọc file Bitwarden CSV...`);
    const rows = parseCSV(csvString);
    if (rows.length < 2) {
      throw new Error("File CSV trống hoặc không hợp lệ");
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
      throw new Error("Tiêu đề cột không khớp với định dạng Bitwarden CSV.");
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

      const customFields: { name: string; value: string; type: number }[] = [];
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
    const validatedList = VaultListSchema.parse(combinedItems);

    return {
      success: true,
      importedCount: newVaultItems.length,
      combinedItems: validatedList,
    };
  } catch (err) {
    console.error(`[${APP_NAME} CSV Import] Lỗi:`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  }
}

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
