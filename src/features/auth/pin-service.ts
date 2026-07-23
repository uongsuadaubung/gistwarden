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
  importAesGcmKey,
} from "@/core/crypto.ts";

import { unlockWithKey } from "@/features/auth/session-service.ts";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export async function setPinUnlock(
  pin: string,
  requireRestart: boolean,
): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key) {
    return err("login_title_locked");
  }

  const raw = await crypto.subtle.exportKey("raw", key);
  const keyBytesB64 = arrayBufferToBase64(raw);

  const rawSalt = generateSalt();
  const pinSaltBase64 = rawSalt.toBase64();
  const pinKeyRes = await deriveKey(pin, rawSalt);
  if (pinKeyRes.isErr()) {
    return err(pinKeyRes.error);
  }
  const pinKey = pinKeyRes.value;
  const encryptRes = await encryptData(keyBytesB64, pinKey);
  if (encryptRes.isErr()) {
    return err(encryptRes.error);
  }
  const { iv, ciphertext } = encryptRes.value;

  await updateSettings({
    pinUnlockEnabled: true,
    pinUnlockValue: ciphertext,
    pinUnlockIv: iv,
    pinUnlockSalt: pinSaltBase64,
    requireMasterPasswordOnRestart: requireRestart,
  });

  return ok();
}

export async function unlockWithPin(
  pin: string,
): Promise<Result<void, TranslationKey>> {
  if (!store.pinUnlockValue || !store.pinUnlockIv || !store.pinUnlockSalt) {
    return err("login_error_wrong_pin");
  }

  const saltBuffer = base64ToArrayBuffer(store.pinUnlockSalt);
  const pinKeyRes = await deriveKey(pin, new Uint8Array(saltBuffer));
  if (pinKeyRes.isErr()) {
    return err("login_error_wrong_pin");
  }
  const pinKey = pinKeyRes.value;
  const decryptRes = await decryptData(
    store.pinUnlockValue,
    store.pinUnlockIv,
    pinKey,
  );
  if (decryptRes.isErr()) {
    return err("login_error_wrong_pin");
  }

  const buffer = base64ToArrayBuffer(decryptRes.value);
  const importRes = await importAesGcmKey(buffer, "login_error_wrong_pin");

  if (importRes.isErr()) {
    return err(importRes.error);
  }

  const res = await unlockWithKey(importRes.value);
  if (res.isErr()) {
    return err(res.error);
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
