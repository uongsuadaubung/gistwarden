import {
  ImportArraySchema,
  ImportObjectSchema,
  type ImportItem,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
} from "./types.ts";

/**
 * Phân tích và xác thực nội dung chuỗi JSON nhập từ tệp (Gistwarden hoặc Bitwarden xuất ra).
 * Trả về danh sách VaultItem[] đã kết hợp với các mục hiện có.
 */
export function parseAndValidateImportJson(
  jsonString: string,
  existingItems: VaultItem[],
): { success: true; importedCount: number; combinedItems: VaultItem[] } | { success: false; error: string } {
  try {
    console.log("[Gistwarden Import] Bắt đầu đọc file JSON...");
    const parsed = JSON.parse(jsonString);
    let itemsToImport: ImportItem[] = [];

    // Validate structure using Zod
    console.log("[Gistwarden Import] Thử parse dạng Array...");
    const parseArray = ImportArraySchema.safeParse(parsed);
    if (parseArray.success) {
      console.log("[Gistwarden Import] Parse dạng Array thành công!");
      itemsToImport = parseArray.data;
    } else {
      console.log(
        "[Gistwarden Import] Parse dạng Array thất bại:",
        parseArray.error.issues,
      );
      console.log(
        "[Gistwarden Import] Kiểm tra định dạng Bitwarden (object chứa danh sách items)...",
      );
      const parseObject = ImportObjectSchema.safeParse(parsed);
      if (parseObject.success) {
        console.log("[Gistwarden Import] Parse dạng Object thành công!");
        itemsToImport = parseObject.data.items;
      } else {
        console.log(
          "[Gistwarden Import] Parse dạng Object thất bại:",
          parseObject.error.issues,
        );
        throw new Error("Định dạng JSON không hợp lệ hoặc không được hỗ trợ");
      }
    }

    console.log(
      `[Gistwarden Import] Kiểm tra xong! Có ${itemsToImport.length} tài khoản cần import.`,
    );

    const now = new Date().toISOString();
    const newVaultItems: VaultItem[] = itemsToImport.map((item, index) => {
      const isLogin = item.type === VaultItemType.Login;
      const loginData = isLogin ? item.login : undefined;
      const rawFido = loginData?.fido2Credentials;
      console.log(
        `[Gistwarden Import] Tài khoản thứ ${index + 1} ("${item.name}"):`,
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
          fields: item.fields ? item.fields.map((f) => ({
            name: f.name || "",
            value: f.value || "",
            type: f.type || 0,
          })) : [],
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
          fields: item.fields ? item.fields.map((f) => ({
            name: f.name || "",
            value: f.value || "",
            type: f.type || 0,
          })) : [],
          login: {
            username: loginData.username || "",
            password: loginData.password || "",
            totp: loginData.totp || "",
            uris: loginData.uris ? loginData.uris.map((u) => ({
              uri: u.uri || "",
            })) : [],
            fido2Credentials: [],
          },
          creationDate: now,
          revisionDate: now,
        };
      }
    });

    console.log(
      "[Gistwarden Import] Bắt đầu kiểm tra và lưu vào danh sách chung...",
    );
    const combinedItems = [...existingItems, ...newVaultItems];
    const validatedList = VaultListSchema.parse(combinedItems);

    console.log("[Gistwarden Import] Kiểm tra Zod thành công!");
    return {
      success: true,
      importedCount: newVaultItems.length,
      combinedItems: validatedList,
    };
  } catch (err) {
    console.error("[Gistwarden Import] Lỗi import:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Lỗi nhập file JSON" };
  }
}
