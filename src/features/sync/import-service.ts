import { accountStore } from "@/core/store.ts";
import { APP_NAME } from "@/core/constants.ts";
import { parseAndValidateImportJson } from "@/features/sync/json-import.ts";
import {
  parseAndValidateBitwardenCsv,
  parseAndValidateBrowserCsv,
} from "@/features/sync/csv-import.ts";
import { type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { persistAndReconcileVault } from "@/features/vault/vault-service.ts";

export async function importJsonData(
  jsonString: string,
): Promise<Result<number, TranslationKey>> {
  const importRes = parseAndValidateImportJson(
    jsonString,
    accountStore.vaultItems,
  );
  if (importRes.isErr()) {
    return err(importRes.error);
  }
  const importVal = importRes.value;

  console.log(`[${APP_NAME} Import] Đang tải lên Gist...`);
  const res = await persistAndReconcileVault(importVal.combinedItems);
  if (res.isErr()) {
    return err(res.error);
  }

  console.log(`[${APP_NAME} Import] Import HOÀN TẤT thành công!`);
  return ok(importVal.importedCount);
}

export async function importCsvData(
  csvString: string,
  type: "browser" | "bitwarden",
): Promise<Result<number, TranslationKey>> {
  const importRes = type === "bitwarden"
    ? parseAndValidateBitwardenCsv(csvString, accountStore.vaultItems)
    : parseAndValidateBrowserCsv(csvString, accountStore.vaultItems);

  if (importRes.isErr()) {
    return err(importRes.error);
  }
  const importVal = importRes.value;

  console.log(`[${APP_NAME} Import] Đang tải lên Gist...`);
  const res = await persistAndReconcileVault(importVal.combinedItems);
  if (res.isErr()) {
    return err(res.error);
  }

  console.log(`[${APP_NAME} Import] Import CSV HOÀN TẤT thành công!`);
  return ok(importVal.importedCount);
}
