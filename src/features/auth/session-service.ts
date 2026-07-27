import { type TranslationKey } from "@/core/i18n.ts";
import type { Result } from "neverthrow";
import type {
  VaultTimeoutAction,
  VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import { sessionManager } from "@/core/session-manager.ts";

export async function updateSessionTimeout(
  timeout: VaultTimeoutValue,
  action: VaultTimeoutAction,
): Promise<void> {
  await sessionManager.updateSessionTimeout(timeout, action);
}

export async function unlockWithKey(
  key: CryptoKey,
): Promise<Result<void, TranslationKey>> {
  return await sessionManager.unlockWithKey(key);
}
