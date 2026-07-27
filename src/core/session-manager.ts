import {
  getAccountSettings,
  getGithubToken,
  getSessionItem,
  removeSessionItem,
  resetAccountSettings,
  setSessionItem,
  setSessionUnlocked,
  updateExtensionSettings,
} from "@/core/storage.ts";
import {
  ALARM_NAME_VAULT_TIMEOUT,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_USER_ACTIVITY,
  SESSION_KEY_DERIVED_KEY,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  SESSION_KEYS_ON_LOCK,
} from "@/core/constants.ts";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  decryptData,
  deriveKey,
  encryptData,
  getOrDeriveKey,
  importAesGcmKey,
} from "@/core/crypto.ts";
import { err, ok, Result, ResultAsync } from "neverthrow";
import {
  accountStore,
  setAccountStore,
  setSettingsStore,
  setUiStore,
  uiStore,
} from "@/core/store.ts";
import { notifyBackground, sendMessageToBackground } from "@/core/messaging.ts";
import {
  DownloadFromGistResponseSchema,
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import { GistPayloadSchema } from "@/features/sync/sync-schemas.ts";
import {
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  VaultPayloadSchema,
} from "@/features/vault/vault-schemas.ts";
import { type TranslationKey } from "@/core/i18n.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { View } from "@/core/types.ts";
import { clearAlarm } from "@/core/alarms.ts";

export class SessionManager {
  private derivedKey: CryptoKey | null = null;

  public getKey(): CryptoKey | null {
    return this.derivedKey;
  }

  public clearKey(): void {
    this.derivedKey = null;
  }

  public async setKey(key: CryptoKey | null): Promise<void> {
    this.derivedKey = key;
    if (key) {
      const raw = await crypto.subtle.exportKey("raw", key);
      const base64 = arrayBufferToBase64(raw);
      await setSessionItem(SESSION_KEY_DERIVED_KEY, base64);
    } else {
      await removeSessionItem(SESSION_KEY_DERIVED_KEY);
    }
  }

  public async getSessionKey(): Promise<CryptoKey | null> {
    if (this.derivedKey) return this.derivedKey;

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
          true, // extractable
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
      this.derivedKey = importRes.value;
      return this.derivedKey;
    }
    return null;
  }

  public async unlockWithKey(
    key: CryptoKey,
  ): Promise<Result<void, TranslationKey>> {
    const accSettingsRes = await getAccountSettings();
    if (accSettingsRes.isErr()) return err(accSettingsRes.error);
    const accSettings = accSettingsRes.value;
    const githubConfigured = !!accSettings.githubTokenEncrypted ||
      !!accountStore.githubToken;
    if (!githubConfigured) {
      this.clearKey();
      return err("login_error_invalid_token");
    }

    this.clearKey(); // Reset

    // Save key bytes to session storage
    await this.setKey(key);

    // Decrypt GitHub Token check
    if (accSettings.githubTokenEncrypted && accSettings.githubTokenIv) {
      const decryptRes = await decryptData(
        accSettings.githubTokenEncrypted,
        accSettings.githubTokenIv,
        key,
      );
      if (decryptRes.isErr()) {
        console.warn("Failed to decrypt githubToken with provided key");
      }
    }

    // B. Đọc cache hoặc tải Gist từ GitHub
    let existingGistContent = "";
    const cachedRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
    const cachedVal = cachedRes.isOk() ? cachedRes.value : null;
    if (typeof cachedVal === "string" && cachedVal) {
      existingGistContent = cachedVal;
    } else {
      const sendResult = await sendMessageToBackground({
        type: MSG_DOWNLOAD_FROM_GIST,
      });
      if (sendResult.isErr()) {
        this.clearKey();
        return err(sendResult.error);
      }

      const downloadResResult = DownloadFromGistResponseSchema.safeParse(
        sendResult.value,
      );
      if (!downloadResResult.success) {
        this.clearKey();
        return err("storage_error");
      }
      const downloadRes = downloadResResult.data;

      if (downloadRes.success && downloadRes.content) {
        existingGistContent = downloadRes.content;
      }
    }

    if (!existingGistContent) {
      this.clearKey();
      return err("github_error_gist_not_found");
    }

    // F. Giải mã dữ liệu két sắt từ Gist
    const payloadResult = safeJsonParse(existingGistContent);
    if (payloadResult.isErr()) {
      this.clearKey();
      return err(payloadResult.error);
    }
    const payloadRaw = payloadResult.value;
    const payloadParsed = GistPayloadSchema.safeParse(payloadRaw);
    if (!payloadParsed.success) {
      this.clearKey();
      return err("storage_error");
    }
    const payload = payloadParsed.data;

    const decryptRes = await decryptData(payload.ciphertext, payload.iv, key);
    if (decryptRes.isErr()) {
      this.clearKey();
      return err(decryptRes.error);
    }

    const itemsJsonResult = safeJsonParse(decryptRes.value);
    if (itemsJsonResult.isErr()) {
      this.clearKey();
      return err(itemsJsonResult.error);
    }

    let items: VaultItem[] = [];
    let trash: TrashVaultItem[] = [];

    const rawVal = itemsJsonResult.value;
    if (Array.isArray(rawVal)) {
      const itemsResult = VaultListSchema.safeParse(rawVal);
      if (!itemsResult.success) {
        this.clearKey();
        return err("storage_error");
      }
      items = itemsResult.data;
    } else {
      const payloadResult = VaultPayloadSchema.safeParse(rawVal);
      if (!payloadResult.success) {
        this.clearKey();
        return err("storage_error");
      }
      items = payloadResult.data.items;
      trash = payloadResult.data.trash || [];
    }

    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("itemId");
    let targetView = uiStore.view === View.Fido2Prompt
      ? View.Fido2Prompt
      : View.Vault;
    let selectedItem = undefined;

    if (itemId && uiStore.view !== View.Fido2Prompt) {
      const foundItem = items.find((i: VaultItem) => i.id === itemId);
      if (foundItem) {
        selectedItem = foundItem;
        targetView = View.ItemDetail;
      }
    }

    const verificationStr = "verification_token";
    const encryptVerifyRes = await encryptData(
      verificationStr,
      key,
    );
    if (encryptVerifyRes.isErr()) {
      this.clearKey();
      return err(encryptVerifyRes.error);
    }
    const { iv: vIv, ciphertext: vCiphertext } = encryptVerifyRes.value;

    const setIvRes = await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
    if (setIvRes.isErr()) return err(setIvRes.error);

    const setCipherRes = await setSessionItem(
      SESSION_KEY_VERIFICATION_CIPHERTEXT,
      vCiphertext,
    );
    if (setCipherRes.isErr()) return err(setCipherRes.error);

    await setSessionUnlocked(true);

    const setVaultRes = await setSessionItem(
      SESSION_KEY_ENCRYPTED_VAULT,
      existingGistContent,
    );
    if (setVaultRes.isErr()) return err(setVaultRes.error);

    const finalToken = await getGithubToken();
    setAccountStore({
      vaultItems: items,
      trashItems: trash,
      githubToken: finalToken,
      githubConfigured: true,
      isLocked: false,
      sessionUnlocked: true,
    });
    setUiStore({
      view: targetView,
      selectedItem: selectedItem || null,
    });
    this.recordActivity();

    return ok();
  }

  public async unlockWithMasterPassword(
    password: string,
  ): Promise<Result<void, TranslationKey>> {
    const accSettingsRes = await getAccountSettings();
    if (accSettingsRes.isErr()) return err(accSettingsRes.error);
    const accSettings = accSettingsRes.value;
    const currentToken = await getGithubToken();
    const githubConfigured = !!accSettings.githubTokenEncrypted ||
      !!currentToken || !!accountStore.githubToken;
    if (!githubConfigured) {
      this.clearKey();
      return err("login_error_invalid_token");
    }

    const saltBase64 = accSettings.salt || accountStore.salt;
    if (!saltBase64) {
      this.clearKey();
      return err("login_error_wrong_mp");
    }

    const keyRes = await getOrDeriveKey(password, saltBase64);
    if (keyRes.isErr()) {
      this.clearKey();
      return err(keyRes.error);
    }
    const key = keyRes.value;

    return await this.unlockWithKey(key);
  }

  public async unlockWithPin(
    pin: string,
  ): Promise<Result<void, TranslationKey>> {
    if (
      !accountStore.pinUnlockValue ||
      !accountStore.pinUnlockIv ||
      !accountStore.pinUnlockSalt
    ) {
      return err("login_error_wrong_pin");
    }

    const saltBufferRes = base64ToArrayBuffer(accountStore.pinUnlockSalt);
    if (saltBufferRes.isErr()) {
      return err("login_error_wrong_pin");
    }
    const pinKeyRes = await deriveKey(pin, new Uint8Array(saltBufferRes.value));
    if (pinKeyRes.isErr()) {
      return err("login_error_wrong_pin");
    }
    const pinKey = pinKeyRes.value;
    const decryptRes = await decryptData(
      accountStore.pinUnlockValue,
      accountStore.pinUnlockIv,
      pinKey,
    );
    if (decryptRes.isErr()) {
      return err("login_error_wrong_pin");
    }

    const bufferRes = base64ToArrayBuffer(decryptRes.value);
    if (bufferRes.isErr()) {
      return err("login_error_wrong_pin");
    }
    const importRes = await importAesGcmKey(
      bufferRes.value,
      "login_error_wrong_pin",
    );

    if (importRes.isErr()) {
      return err(importRes.error);
    }

    return await this.unlockWithKey(importRes.value);
  }

  public async lockSession(): Promise<void> {
    this.clearKey();
    await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
    await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

    setAccountStore({
      vaultItems: [],
      trashItems: [],
      githubToken: "",
      isLocked: true,
      sessionUnlocked: false,
    });
    setUiStore({
      view: uiStore.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
      selectedItem: null,
    });
  }

  public async logoutSession(): Promise<void> {
    this.clearKey();
    await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
    await resetAccountSettings();
    await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

    setAccountStore({
      vaultItems: [],
      trashItems: [],
      githubToken: "",
      isLocked: true,
      sessionUnlocked: false,
    });
    setUiStore({
      view: View.Login,
      selectedItem: null,
    });
  }

  public isUnlocked(): boolean {
    return this.derivedKey !== null;
  }

  public recordActivity(): void {
    notifyBackground({ type: MSG_USER_ACTIVITY });
  }

  public async updateSessionTimeout(
    timeout: VaultTimeoutValue,
    action: VaultTimeoutAction,
  ): Promise<void> {
    setSettingsStore({
      vaultTimeout: timeout,
      vaultTimeoutAction: action,
    });
    await updateExtensionSettings({
      vaultTimeout: timeout,
      vaultTimeoutAction: action,
    });
    this.recordActivity();
  }
}

export const sessionManager = new SessionManager();
