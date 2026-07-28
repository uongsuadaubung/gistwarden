import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
  updateExtensionSettings,
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@gistwarden/repository";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  MSG_USER_ACTIVITY,
  SESSION_KEY_DERIVED_KEY,
  sessionManager,
} from "@gistwarden/domain";
import { ResultAsync } from "neverthrow";
import { notifyBackground } from "./messaging.ts";

export async function persistSessionKey(
  key: CryptoKey | null,
): Promise<void> {
  sessionManager.setKey(key);
  if (key) {
    const raw = await crypto.subtle.exportKey("raw", key);
    const base64 = arrayBufferToBase64(raw);
    await setSessionItem(SESSION_KEY_DERIVED_KEY, base64);
  } else {
    await removeSessionItem(SESSION_KEY_DERIVED_KEY);
  }
}

export async function restoreSessionKeyFromStorage(): Promise<
  CryptoKey | null
> {
  const currentKey = sessionManager.getKey();
  if (currentKey) return currentKey;

  const base64Res = await getSessionItem(SESSION_KEY_DERIVED_KEY);
  const base64 = base64Res.isOk() ? base64Res.value : null;
  if (typeof base64 === "string" && base64) {
    const bufferRes = base64ToArrayBuffer(base64);
    if (bufferRes.isErr()) return null;
    const buffer = bufferRes.value;
    const importRes = await ResultAsync.fromPromise(
      crypto.subtle.importKey(
        "raw",
        buffer,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
      ),
      (e) => e,
    );
    if (importRes.isErr()) {
      console.error(
        "[Crypto] Failed to import key from session storage:",
        importRes.error,
      );
      return null;
    }
    sessionManager.setKey(importRes.value);
    return importRes.value;
  }
  return null;
}

export function recordUserActivity(): void {
  notifyBackground({ type: MSG_USER_ACTIVITY });
}

export async function updateSessionTimeoutUseCase(
  timeout: VaultTimeoutValue,
  action: VaultTimeoutAction,
): Promise<void> {
  await updateExtensionSettings({
    vaultTimeout: timeout,
    vaultTimeoutAction: action,
  });
  recordUserActivity();
}
