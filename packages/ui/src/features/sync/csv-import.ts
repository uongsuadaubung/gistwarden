import {
  type Folder,
  parseBitwardenCsvImportWasm,
  parseBrowserCsvImportWasm,
  toTranslationKey,
  type TranslationKey,
  type VaultItem,
  VaultListSchema,
} from "@gistwarden/domain";

import { err, ok, Result } from "neverthrow";

/**
 * Phân tích và xác thực file CSV trình duyệt (Chrome, Edge, Firefox) ủy quyền 100% cho Rust WASM.
 */
export function parseAndValidateBrowserCsv(
  csvString: string,
  existingItems: VaultItem[],
): Result<
  { importedCount: number; combinedItems: VaultItem[] },
  TranslationKey
> {
  try {
    const res = parseBrowserCsvImportWasm(csvString);
    const combinedItems = [...existingItems, ...res.newItems];
    const validatedListResult = VaultListSchema.safeParse(combinedItems);
    if (!validatedListResult.success) {
      return err("storage_error");
    }

    return ok({
      importedCount: res.importedCount,
      combinedItems: validatedListResult.data,
    });
  } catch (e: unknown) {
    const errKey = typeof e === "string" ? e : "vault_import_csv_error_fail";
    return err(toTranslationKey(errKey, "vault_import_csv_error_fail"));
  }
}

/**
 * Phân tích và xác thực file Bitwarden CSV ủy quyền 100% cho Rust WASM.
 */
export function parseAndValidateBitwardenCsv(
  csvString: string,
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
    const foldersJson = JSON.stringify(existingFolders);
    const res = parseBitwardenCsvImportWasm(csvString, foldersJson);
    const combinedItems = [...existingItems, ...res.newItems];
    const validatedListResult = VaultListSchema.safeParse(combinedItems);
    if (!validatedListResult.success) {
      return err("storage_error");
    }

    return ok({
      importedCount: res.importedCount,
      combinedItems: validatedListResult.data,
      combinedFolders: res.combinedFolders,
    });
  } catch (e: unknown) {
    const errKey = typeof e === "string" ? e : "vault_import_csv_error_fail";
    return err(toTranslationKey(errKey, "vault_import_csv_error_fail"));
  }
}
