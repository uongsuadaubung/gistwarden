import { setAccountStore, setSettingsStore } from "@/core/store.ts";
import { DEFAULT_PIN_CONFIG } from "@gistwarden/repository";
import {
  updateAccountSettings,
  updateExtensionSettings,
} from "@/core/storage.ts";

import { arrayBufferToBase64, deriveKey } from "@/core/crypto.ts";
import { computeHmac, encryptData, generateSalt } from "@gistwarden/domain";
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

  const keyBytesB64 = arrayBufferToBase64(key);

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

  const macRes = await computeHmac("0", pinSaltBase64);
  const failedMac = macRes.isOk() ? macRes.value : "";

  const pinConfig = {
    enabled: true,
    value: ciphertext,
    iv: iv,
    salt: pinSaltBase64,
    failedAttempts: 0,
    failedMac,
  };

  setAccountStore("pinConfig", pinConfig);
  setSettingsStore("requireMasterPasswordOnRestart", requireRestart);

  await updateAccountSettings({ pinConfig });
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
  setAccountStore("pinConfig", DEFAULT_PIN_CONFIG);
  setSettingsStore("requireMasterPasswordOnRestart", true);

  await updateAccountSettings({ pinConfig: DEFAULT_PIN_CONFIG });
  await updateExtensionSettings({
    requireMasterPasswordOnRestart: true,
  });
}
