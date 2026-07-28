import { setAccountStore, setSettingsStore } from "@/core/store.ts";
import {
  updateAccountSettings,
  updateExtensionSettings,
} from "@/core/storage.ts";
import { arrayBufferToBase64, deriveKey } from "@/core/crypto.ts";
import { encryptData, generateSalt } from "@gistwarden/domain";
import { getSessionKey } from "@gistwarden/orchestrator";

import { unlockVaultWithPin } from "@/features/auth/auth-service.ts";
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

  setAccountStore({
    pinUnlockEnabled: true,
    pinUnlockValue: ciphertext,
    pinUnlockIv: iv,
    pinUnlockSalt: pinSaltBase64,
  });
  setSettingsStore("requireMasterPasswordOnRestart", requireRestart);

  await updateAccountSettings({
    pinUnlockEnabled: true,
    pinUnlockValue: ciphertext,
    pinUnlockIv: iv,
    pinUnlockSalt: pinSaltBase64,
  });
  await updateExtensionSettings({
    requireMasterPasswordOnRestart: requireRestart,
  });

  return ok();
}

export async function unlockWithPin(
  pin: string,
): Promise<Result<void, TranslationKey>> {
  return await unlockVaultWithPin(pin);
}

export async function disablePinUnlock(): Promise<void> {
  setAccountStore({
    pinUnlockEnabled: false,
    pinUnlockValue: "",
    pinUnlockIv: "",
    pinUnlockSalt: "",
  });
  setSettingsStore("requireMasterPasswordOnRestart", true);

  await updateAccountSettings({
    pinUnlockEnabled: false,
    pinUnlockValue: "",
    pinUnlockIv: "",
    pinUnlockSalt: "",
  });
  await updateExtensionSettings({
    requireMasterPasswordOnRestart: true,
  });
}
