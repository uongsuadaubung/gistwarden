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

import { unlockWithKey } from "@/features/auth/auth-service.ts";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export async function setPinUnlock(
  pin: string,
  requireRestart: boolean,
): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key) {
    return err("login_title_locked");
  }

  const result = await ResultAsync.fromPromise(
    (async () => {
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
    })(),
    (error): TranslationKey => {
      console.error("[Store] Set PIN failed:", error);
      return "toast_error";
    },
  );

  return result;
}

export async function unlockWithPin(
  pin: string,
): Promise<Result<void, TranslationKey>> {
  if (!store.pinUnlockValue || !store.pinUnlockIv || !store.pinUnlockSalt) {
    return err("login_error_wrong_pin");
  }

  const result = await ResultAsync.fromPromise(
    (async () => {
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

      return key;
    })(),
    (error): TranslationKey => {
      console.error("[Auth Service] PIN unlock failed:", error);
      return "login_error_wrong_pin";
    },
  );

  if (result.isErr()) {
    return err(result.error);
  }

  const res = await unlockWithKey(result.value);
  if (!res.success) {
    return err("login_error_unlock_fail");
  }

  return ok();
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
