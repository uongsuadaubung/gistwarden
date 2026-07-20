import { store } from "@/core/store.ts";
import { updateSettings } from "@/core/storage.ts";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
  getSessionKey,
} from "@/core/crypto.ts";
import { setGlobalLoading } from "@/core/ui-service.ts";
import { unlockWithKey } from "@/features/auth/auth-service.ts";

export async function setPinUnlock(
  pin: string,
  requireRestart: boolean,
): Promise<{ success: boolean; error?: string }> {
  setGlobalLoading(true);
  try {
    const key = await getSessionKey();
    if (!key) {
      throw new Error("Vault is locked");
    }
    const raw = await crypto.subtle.exportKey("raw", key);
    const keyBytesB64 = arrayBufferToBase64(raw);

    const rawSalt = generateSalt();
    const pinSaltBase64 = btoa(String.fromCharCode(...rawSalt));
    const pinKey = await deriveKey(pin, rawSalt);
    const { iv, ciphertext } = await encryptData(keyBytesB64, pinKey);

    await updateSettings({
      pinUnlockEnabled: true,
      pinUnlockValue: ciphertext,
      pinUnlockIv: iv,
      pinUnlockSalt: pinSaltBase64,
      requireMasterPasswordOnRestart: requireRestart,
    });

    return { success: true };
  } catch (err) {
    console.error("[Store] Set PIN failed:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Failed to set PIN" };
  } finally {
    setGlobalLoading(false);
  }
}

export async function unlockWithPin(
  pin: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!store.pinUnlockValue || !store.pinUnlockIv || !store.pinUnlockSalt) {
      throw new Error("Missing PIN configuration");
    }

    const saltBuffer = base64ToArrayBuffer(store.pinUnlockSalt);
    const pinKey = await deriveKey(pin, new Uint8Array(saltBuffer));
    const decryptedKeyBytesB64 = await decryptData(
      store.pinUnlockValue,
      store.pinUnlockIv,
      pinKey,
    );

    const buffer = base64ToArrayBuffer(decryptedKeyBytesB64);
    const key = await crypto.subtle.importKey(
      "raw",
      buffer,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );

    return await unlockWithKey(key);
  } catch (err) {
    console.error("[Auth Service] PIN unlock failed:", err);
    return { success: false, error: "login_error_wrong_pin" };
  }
}

export async function disablePinUnlock(): Promise<void> {
  await updateSettings({
    pinUnlockEnabled: false,
    pinUnlockValue: "",
    pinUnlockIv: "",
    pinUnlockSalt: "",
    requireMasterPasswordOnRestart: true,
  });
}
