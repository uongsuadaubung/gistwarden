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
import { notifyBackground } from "./messaging.ts";

export async function persistSessionKey(
  key: Uint8Array | null,
): Promise<void> {
  sessionManager.setKey(key);
  if (key) {
    const base64 = arrayBufferToBase64(key);
    await setSessionItem(SESSION_KEY_DERIVED_KEY, base64);
  } else {
    await removeSessionItem(SESSION_KEY_DERIVED_KEY);
  }
}

export async function restoreSessionKeyFromStorage(): Promise<
  Uint8Array | null
> {
  const currentKey = sessionManager.getKey();
  if (currentKey) return currentKey;

  const base64Res = await getSessionItem(SESSION_KEY_DERIVED_KEY);
  const base64 = base64Res.isOk() ? base64Res.value : null;
  if (typeof base64 === "string" && base64) {
    const bufferRes = base64ToArrayBuffer(base64);
    if (bufferRes.isErr()) return null;
    const key = new Uint8Array(bufferRes.value);
    sessionManager.setKey(key);
    return key;
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
