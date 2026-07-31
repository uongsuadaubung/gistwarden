import { type Folder, FolderSchema, VaultItemType } from "@gistwarden/domain";
import { type ImportItem, ImportItemSchema } from "@gistwarden/repository";
import { type VaultItem, VaultListSchema } from "@gistwarden/domain";
import { APP_NAME } from "@/core/constants.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { createBaseVaultItem } from "@gistwarden/domain";

import { mergeFolders } from "@gistwarden/orchestrator";

/**
 * Phân tích và xác thực nội dung chuỗi JSON nhập từ tệp ({APP_NAME} hoặc Bitwarden xuất ra).
 * Trả về danh sách VaultItem[] và Folder[] đã kết hợp với các mục hiện có.
 */
export function parseAndValidateImportJson(
  jsonString: string,
  existingItems: VaultItem[],
  existingFolders: Folder[] = [],
): Result<
  {
    importedCount: number;
    combinedItems: VaultItem[];
    combinedFolders: Folder[];
  },
  TranslationKey
> {
  console.log(`[${APP_NAME} Import] Bắt đầu đọc file JSON...`);

  const parseRes = safeJsonParse(jsonString);
  if (parseRes.isErr()) {
    console.error(`[${APP_NAME} Import] Lỗi phân tích JSON`);
    return err("vault_import_error_invalid");
  }
  const parsed = parseRes.value;

  const itemsToImport: ImportItem[] = [];
  const importedFolders: Folder[] = [];

  // Extract raw folders list if present using Reflect.get (no 'as' assertion)
  const rawFolders = parsed !== null && typeof parsed === "object"
    ? Reflect.get(parsed, "folders")
    : null;

  if (Array.isArray(rawFolders)) {
    for (const rawFolder of rawFolders) {
      const folderRes = FolderSchema.safeParse(rawFolder);
      if (folderRes.success) {
        importedFolders.push(folderRes.data);
      }
    }
  }

  // Extract raw items list
  let rawItems: unknown[] = [];
  const parsedItems = parsed !== null && typeof parsed === "object"
    ? Reflect.get(parsed, "items")
    : null;

  if (Array.isArray(parsed)) {
    rawItems = parsed;
  } else if (Array.isArray(parsedItems)) {
    rawItems = parsedItems;
  } else {
    return err("vault_import_error_invalid");
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
    `[${APP_NAME} Import] Kiểm tra xong! Có ${itemsToImport.length} tài khoản và ${importedFolders.length} thư mục hợp lệ cần import.`,
  );

  const now = new Date().toISOString();
  const newVaultItems: VaultItem[] = itemsToImport.map((item) => {
    const isLogin = item.type === VaultItemType.Login;
    const loginData = isLogin ? item.login : undefined;
    const rawFido = loginData?.fido2Credentials;

    const base = createBaseVaultItem({
      id: item.id || undefined,
      folderId: item.folderId || null,
      name: item.name,
      notes: item.notes,
      favorite: item.favorite,
      reprompt: item.reprompt,
      fields: item.fields,
      creationDate: item.creationDate || undefined,
      revisionDate: item.revisionDate || undefined,
      fallbackName: item.type === VaultItemType.SecureNote
        ? "Chưa đặt tên note"
        : item.type === VaultItemType.Card
        ? "Chưa đặt tên card"
        : item.type === VaultItemType.Identity
        ? "Chưa đặt tên danh tính"
        : "Chưa đặt tên",
    });

    if (item.type === VaultItemType.SecureNote) {
      return {
        ...base,
        type: VaultItemType.SecureNote,
      };
    } else if (item.type === VaultItemType.Card) {
      const cardData = item.card || {};
      return {
        ...base,
        type: VaultItemType.Card,
        card: {
          cardholderName: cardData.cardholderName || "",
          brand: cardData.brand || "",
          number: cardData.number || "",
          expMonth: cardData.expMonth || "",
          expYear: cardData.expYear || "",
          code: cardData.code || "",
        },
      };
    } else if (item.type === VaultItemType.Identity) {
      const identityData = item.identity || {};
      return {
        ...base,
        type: VaultItemType.Identity,
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
      };
    } else {
      return {
        ...base,
        type: VaultItemType.Login,
        login: {
          username: loginData?.username || "",
          password: loginData?.password || "",
          totp: loginData?.totp || "",
          uris: loginData?.uris
            ? loginData.uris.map((u) => ({
              uri: u.uri || "",
              match: u.match || null,
            }))
            : [],
          fido2Credentials: rawFido?.map((c) => ({
            credentialId: c.credentialId || "",
            keyType: c.keyType || "",
            keyAlgorithm: c.keyAlgorithm || "",
            keyCurve: c.keyCurve || "",
            keyValue: c.keyValue || "",
            counter: c.counter ?? 0,
            rpId: c.rpId || "",
            userHandle: c.userHandle || "",
            userName: c.userName || "",
            userDisplayName: c.userDisplayName || "",
            creationDate: c.creationDate || now,
            discoverable: c.discoverable,
          })) || [],
        },
      };
    }
  });

  // Merge logic for items
  const existingMap = new Map<string, VaultItem>();
  for (const item of existingItems) {
    if (item.type === VaultItemType.Login) {
      if (item.login?.uris && item.login.uris.length > 0) {
        const mainUri = item.login.uris[0].uri;
        const key = `${mainUri}|${item.login.username}`;
        existingMap.set(key, item);
      } else {
        existingMap.set(`||${item.name}`, item);
      }
    } else {
      existingMap.set(`||${item.name}`, item);
    }
  }

  let addedCount = 0;
  const finalItems = [...existingItems];

  for (const newItem of newVaultItems) {
    if (newItem.type === VaultItemType.Login) {
      const uri = newItem.login?.uris?.[0]?.uri || "";
      const username = newItem.login?.username || "";
      const key = uri ? `${uri}|${username}` : `||${newItem.name}`;

      if (!existingMap.has(key)) {
        finalItems.push(newItem);
        existingMap.set(key, newItem);
        addedCount++;
      } else {
        // Check for fido2 credentials merge
        const existingItem = existingMap.get(key)!;
        if (
          existingItem.type === VaultItemType.Login &&
          newItem.login?.fido2Credentials &&
          newItem.login.fido2Credentials.length > 0
        ) {
          const existingFido = existingItem.login?.fido2Credentials || [];
          const mergedFido = [...existingFido];
          let fidoAdded = false;

          for (const newFido of newItem.login.fido2Credentials) {
            const fidoExists = existingFido.some(
              (f) => f.credentialId === newFido.credentialId,
            );
            if (!fidoExists) {
              mergedFido.push(newFido);
              fidoAdded = true;
            }
          }

          if (fidoAdded && existingItem.login) {
            existingItem.login.fido2Credentials = mergedFido;
          }
        }
      }
    } else {
      const key = `||${newItem.name}`;
      if (!existingMap.has(key)) {
        finalItems.push(newItem);
        existingMap.set(key, newItem);
        addedCount++;
      }
    }
  }

  const validateResult = VaultListSchema.safeParse(finalItems);
  if (!validateResult.success) {
    console.error(
      `[${APP_NAME} Import] Lỗi kiểm tra dữ liệu sau khi gộp:`,
      validateResult.error,
    );
    return err("storage_error");
  }

  const combinedFolders = mergeFolders(existingFolders, importedFolders);

  return ok({
    importedCount: addedCount,
    combinedItems: validateResult.data,
    combinedFolders,
  });
}
