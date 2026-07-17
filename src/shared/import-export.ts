import {
  type ImportItem,
  ImportItemSchema,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
} from "./types.ts";
import { APP_NAME } from "./constants.ts";

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
