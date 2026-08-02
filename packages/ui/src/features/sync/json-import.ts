import {
  type Folder,
  parseJsonImportWasm,
  toTranslationKey,
  type TranslationKey,
  type VaultItem,
  VaultListSchema,
} from "@gistwarden/domain";
import { err, ok, Result } from "neverthrow";

/**
 * Phân tích và xác thực nội dung chuỗi JSON nhập từ tệp ({APP_NAME} hoặc Bitwarden xuất ra) ủy quyền 100% cho Rust WASM.
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
  try {
    const existingItemsJson = JSON.stringify(existingItems || []);
    const existingFoldersJson = JSON.stringify(existingFolders || []);

    const res = parseJsonImportWasm(
      jsonString,
      existingItemsJson,
      existingFoldersJson,
    );

    const validateResult = VaultListSchema.safeParse(res.combinedItems);
    if (!validateResult.success) {
      return err("storage_error");
    }

    return ok({
      importedCount: res.importedCount,
      combinedItems: validateResult.data,
      combinedFolders: res.combinedFolders,
    });
  } catch (e: unknown) {
    const errKey = typeof e === "string" ? e : "vault_import_error_invalid";
    return err(toTranslationKey(errKey, "vault_import_error_invalid"));
  }
}
