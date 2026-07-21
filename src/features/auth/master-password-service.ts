import {
  deriveKey,
  encryptData,
  generateSalt,
  setDerivedKey,
  verifyMasterPassword,
} from "@/core/crypto.ts";
import { getGithubToken, setSessionItem } from "@/core/storage.ts";
import { updateSettings } from "@/core/storage.ts";
import {
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
} from "@/core/constants.ts";
import { setStore, store } from "@/core/store.ts";
import { syncVaultToGist } from "@/features/sync/sync-utils.ts";
import { err, ok, Result } from "neverthrow";
import { type TranslationKey } from "@/core/i18n.ts";

export async function changeMasterPassword(
  currentPass: string,
  newPass: string,
): Promise<Result<void, TranslationKey>> {
  if (!newPass.trim()) {
    return err("settings_error_mp_empty_new");
  }

  const isCurrentPasswordCorrect = await verifyMasterPassword(currentPass);
  if (!isCurrentPasswordCorrect) {
    return err("settings_error_mp_wrong_current");
  }

  // 1. Generate a new salt
  const rawSalt = generateSalt();
  const newSaltBase64 = btoa(String.fromCharCode(...rawSalt));

  // 2. Derive new key (Web Crypto API)
  const deriveResult = await deriveKey(newPass, rawSalt);
  if (deriveResult.isErr()) {
    return err(deriveResult.error);
  }
  const newKey = deriveResult.value;

  // 3. Đồng bộ lên Gist (API mạng)
  const uploadRes = await syncVaultToGist(
    store.vaultItems,
    newKey,
    newSaltBase64,
  );
  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  // 4. Update session key and verification ciphertext
  await setDerivedKey(newKey);
  const verificationStr = "verification_token";
  const encryptVerifyResult = await encryptData(verificationStr, newKey);
  if (encryptVerifyResult.isErr()) {
    return err(encryptVerifyResult.error);
  }
  const { iv: vIv, ciphertext: vCiphertext } = encryptVerifyResult.value;

  await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
  await setSessionItem(SESSION_KEY_VERIFICATION_CIPHERTEXT, vCiphertext);

  // 5. Re-encrypt GitHub token with the new key and save to settings
  const githubToken = await getGithubToken();
  if (githubToken) {
    const encryptTokenResult = await encryptData(githubToken, newKey);
    if (encryptTokenResult.isErr()) {
      return err(encryptTokenResult.error);
    }
    const { iv, ciphertext } = encryptTokenResult.value;

    await updateSettings({
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
      salt: newSaltBase64,
      pinUnlockEnabled: false,
      pinUnlockValue: "",
      pinUnlockIv: "",
      pinUnlockSalt: "",
    });
  } else {
    await updateSettings({
      salt: newSaltBase64,
      pinUnlockEnabled: false,
      pinUnlockValue: "",
      pinUnlockIv: "",
      pinUnlockSalt: "",
    });
  }

  setStore({
    salt: newSaltBase64,
  });

  return ok(undefined);
}
