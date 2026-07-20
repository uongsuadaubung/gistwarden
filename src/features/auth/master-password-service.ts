import {
  deriveKey,
  encryptData,
  generateSalt,
  setDerivedKey,
  verifyMasterPassword,
} from "@/core/crypto.ts";
import { setSessionItem, getGithubToken } from "@/core/storage.ts";
import { updateSettings } from "@/core/storage.ts";
import { SESSION_KEY_VERIFICATION_CIPHERTEXT, SESSION_KEY_VERIFICATION_IV } from "@/core/constants.ts";
import { store, setStore } from "@/core/store.ts";
import { setGlobalLoading } from "@/core/ui-service.ts";
import { syncVaultToGist } from "@/features/sync/sync-utils.ts";

export async function changeMasterPassword(
  currentPass: string,
  newPass: string,
): Promise<{ success: boolean; error?: string }> {
  setGlobalLoading(true);
  try {
    const isCurrentPasswordCorrect = await verifyMasterPassword(currentPass);
    if (!isCurrentPasswordCorrect) {
      return { success: false, error: "Mật khẩu Master hiện tại không đúng" };
    }
    if (!newPass.trim()) {
      return {
        success: false,
        error: "Mật khẩu Master mới không được để trống",
      };
    }

    // 1. Generate a new salt
    const rawSalt = generateSalt();
    const newSaltBase64 = btoa(String.fromCharCode(...rawSalt));

    // 2. Derive new key
    const newKey = await deriveKey(newPass, rawSalt);

    const uploadRes = await syncVaultToGist(
      store.vaultItems,
      newKey,
      newSaltBase64,
    );

    if (!uploadRes.success) {
      throw new Error(uploadRes.error || "Lỗi đồng bộ mật khẩu mới lên Gist");
    }

    // 3. Update session key and verification ciphertext
    await setDerivedKey(newKey);
    const verificationStr = "verification_token";
    const { iv: vIv, ciphertext: vCiphertext } = await encryptData(
      verificationStr,
      newKey,
    );
    await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
    await setSessionItem(SESSION_KEY_VERIFICATION_CIPHERTEXT, vCiphertext);

    // 4. Re-encrypt GitHub token with the new key and save to settings
    const githubToken = await getGithubToken();
    if (githubToken) {
      const { iv, ciphertext } = await encryptData(githubToken, newKey);
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

    return { success: true };
  } catch (err) {
    console.error("[Store] Change Master Password failed:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Lỗi đổi mật khẩu" };
  } finally {
    setGlobalLoading(false);
  }
}
