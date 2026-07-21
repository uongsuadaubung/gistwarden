import { reconcile } from "solid-js/store";
import { setStore, store } from "@/core/store.ts";
import { getSessionKey } from "@/core/crypto.ts";
import { APP_NAME } from "@/core/constants.ts";
import { syncVaultToGist } from "@/features/sync/sync-utils.ts";
import { parseAndValidateImportJson } from "@/features/sync/json-import.ts";
import {
  parseAndValidateBitwardenCsv,
  parseAndValidateBrowserCsv,
} from "@/features/sync/csv-import.ts";
import { t } from "@/core/i18n.ts";
import { setGlobalLoading } from "@/core/ui-service.ts";

export async function importJsonData(
  jsonString: string,
): Promise<{ success: boolean; importedCount?: number; error?: string }> {
  setGlobalLoading(true, t("vault_importing"));
  try {
    const importRes = parseAndValidateImportJson(jsonString, store.vaultItems);
    if (!importRes.success) {
      throw new Error(importRes.error);
    }

    const key = await getSessionKey();
    if (!key || !store.salt) throw new Error("Vault is locked");

    console.log(`[${APP_NAME} Import] Dang tai len Gist...`);
    const uploadRes = await syncVaultToGist(
      importRes.combinedItems,
      key,
      store.salt,
    );

    if (uploadRes.isErr()) {
      throw new Error(uploadRes.error);
    }
    const validatedList = uploadRes.value;

    setStore(
      "vaultItems",
      reconcile(validatedList),
    );
    console.log(`[${APP_NAME} Import] Import HOAN TAT thanh cong!`);
    return { success: true, importedCount: importRes.importedCount };
  } catch (err) {
    console.error(`[${APP_NAME} Import] Loi import:`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Loi nhap file JSON" };
  } finally {
    setGlobalLoading(false);
  }
}

export async function importCsvData(
  csvString: string,
  type: "browser" | "bitwarden",
): Promise<{ success: boolean; importedCount?: number; error?: string }> {
  setGlobalLoading(true, t("vault_importing"));
  try {
    const importRes = type === "bitwarden"
      ? parseAndValidateBitwardenCsv(csvString, store.vaultItems)
      : parseAndValidateBrowserCsv(csvString, store.vaultItems);

    if (!importRes.success) {
      throw new Error(importRes.error);
    }

    const key = await getSessionKey();
    if (!key || !store.salt) throw new Error("Vault is locked");

    console.log(`[${APP_NAME} Import] Đang tải lên Gist...`);
    const uploadRes = await syncVaultToGist(
      importRes.combinedItems,
      key,
      store.salt,
    );

    if (uploadRes.isErr()) {
      throw new Error(uploadRes.error);
    }
    const validatedList = uploadRes.value;

    setStore(
      "vaultItems",
      reconcile(validatedList),
    );
    console.log(`[${APP_NAME} Import] Import CSV HOÀN TẤT thành công!`);
    return { success: true, importedCount: importRes.importedCount };
  } catch (err) {
    console.error(`[${APP_NAME} Import] Lỗi import CSV:`, err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  } finally {
    setGlobalLoading(false);
  }
}
