import {
  base64ToArrayBuffer,
  decryptData,
  deriveKey,
  OAUTH_WORKER_URL,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  safeJsonParse,
  type TranslationKey,
} from "@gistwarden/domain";
import { fetchText } from "@gistwarden/network";
import {
  getAccountSettings,
  getSessionItem,
  updateExtensionSettings,
  type VaultMode,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { vaultSecurityContext } from "./vault-security-state.ts";

export {
  LockedVaultState,
  SessionExpiredVaultState,
  UnlockedVaultState,
  VaultSecurityContext,
  vaultSecurityContext,
} from "./vault-security-state.ts";

export async function clearDerivedKey(): Promise<void> {
  await vaultSecurityContext.lock();
}

export async function setDerivedKey(key: CryptoKey | null): Promise<void> {
  if (key) {
    await vaultSecurityContext.setUnlockedKey(key);
  } else {
    await vaultSecurityContext.lock();
  }
}

export async function getOrDeriveKey(
  password: string,
  saltBase64: string,
): Promise<Result<CryptoKey, TranslationKey>> {
  const saltBufferRes = base64ToArrayBuffer(saltBase64);
  if (saltBufferRes.isErr()) return err(saltBufferRes.error);
  const salt = new Uint8Array(saltBufferRes.value);

  const deriveRes = await deriveKey(password, salt);
  if (deriveRes.isErr()) {
    return err(deriveRes.error);
  }
  return ok(deriveRes.value);
}

export async function getSessionKey(): Promise<CryptoKey | null> {
  return await vaultSecurityContext.getKey();
}

export async function verifyMasterPassword(
  password: string,
  mode: VaultMode,
): Promise<boolean> {
  const ivRes = await getSessionItem(SESSION_KEY_VERIFICATION_IV);
  const ciphertextRes = await getSessionItem(
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
  );
  const ivB64 = ivRes.isOk() ? ivRes.value : null;
  const ciphertextB64 = ciphertextRes.isOk() ? ciphertextRes.value : null;
  const settingsRes = await getAccountSettings(mode);
  if (settingsRes.isErr()) {
    return false;
  }
  const saltBase64 = settingsRes.value.masterPasswordConfig.salt;
  if (
    typeof ivB64 !== "string" ||
    typeof ciphertextB64 !== "string" ||
    !saltBase64
  ) {
    return false;
  }

  const saltBufferRes = base64ToArrayBuffer(saltBase64);
  if (saltBufferRes.isErr()) return false;
  const salt = new Uint8Array(saltBufferRes.value);
  const deriveRes = await deriveKey(password, salt);
  if (deriveRes.isErr()) return false;
  const key = deriveRes.value;

  const decryptedRes = await decryptData(ciphertextB64, ivB64, key);
  if (decryptedRes.isErr()) return false;

  return decryptedRes.value === "verification_token";
}

const TimeServerResponseSchema = z
  .object({
    unixtime: z.number(),
  })
  .readonly();

export async function syncTimeOffsetUseCase(): Promise<
  Result<number, TranslationKey>
> {
  const textRes = await fetchText(`${OAUTH_WORKER_URL}/time`);
  if (textRes.isErr()) {
    return err(textRes.error);
  }

  const jsonRes = safeJsonParse(textRes.value);
  if (jsonRes.isErr()) {
    return err("settings_sync_time_error");
  }

  const parseResult = TimeServerResponseSchema.safeParse(jsonRes.value);
  if (parseResult.success) {
    const serverTime = parseResult.data.unixtime * 1000;
    const localTime = Date.now();
    const offset = serverTime - localTime;
    const updateRes = await updateExtensionSettings({ timeOffset: offset });
    if (updateRes.isErr()) {
      return err("storage_error");
    }
    return ok(offset);
  }

  return err("settings_sync_time_error");
}
