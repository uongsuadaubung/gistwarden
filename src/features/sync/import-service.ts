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
import { t, type TranslationKey } from "@/core/i18n.ts";
import { setGlobalLoading } from "@/core/ui-service.ts";
import { err, ok, Result } from "neverthrow";

export async function importJsonData(
  jsonString: string,
): Promise<Result<number, TranslationKey>> {
  setGlobalLoading(true, t("vault_importing"));

  const importRes = parseAndValidateImportJson(jsonString, store.vaultItems);
  if (importRes.isErr()) {
    setGlobalLoading(false);
    return err(importRes.error);
  }
  const importVal = importRes.value;

  const key = await getSessionKey();
  if (!key || !store.salt) {
    setGlobalLoading(false);
    return err("toast_error");
  }

  console.log(`[${APP_NAME} Import] Dang tai len Gist...`);
  const uploadRes = await syncVaultToGist(
    importVal.combinedItems,
    key,
    store.salt,
  );

  if (uploadRes.isErr()) {
    setGlobalLoading(false);
    return err(uploadRes.error);
  }
  const validatedList = uploadRes.value;

  setStore(
    "vaultItems",
    reconcile(validatedList),
  );
  console.log(`[${APP_NAME} Import] Import HOAN TAT thanh cong!`);
  setGlobalLoading(false);
  return ok(importVal.importedCount);
}

export async function importCsvData(
  csvString: string,
  type: "browser" | "bitwarden",
): Promise<Result<number, TranslationKey>> {
  setGlobalLoading(true, t("vault_importing"));

  const importRes = type === "bitwarden"
    ? parseAndValidateBitwardenCsv(csvString, store.vaultItems)
    : parseAndValidateBrowserCsv(csvString, store.vaultItems);

  if (importRes.isErr()) {
    setGlobalLoading(false);
    return err(importRes.error);
  }
  const importVal = importRes.value;

  const key = await getSessionKey();
  if (!key || !store.salt) {
    setGlobalLoading(false);
    return err("toast_error");
  }

  console.log(`[${APP_NAME} Import] Đang tải lên Gist...`);
  const uploadRes = await syncVaultToGist(
    importVal.combinedItems,
    key,
    store.salt,
  );

  if (uploadRes.isErr()) {
    setGlobalLoading(false);
    return err(uploadRes.error);
  }
  const validatedList = uploadRes.value;

  setStore(
    "vaultItems",
    reconcile(validatedList),
  );
  console.log(`[${APP_NAME} Import] Import CSV HOÀN TẤT thành công!`);
  setGlobalLoading(false);
  return ok(importVal.importedCount);
}
