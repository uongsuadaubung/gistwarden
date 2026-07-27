import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
  updateExtensionSettings,
} from "@/core/storage.ts";
import {
  MSG_USER_ACTIVITY,
  SESSION_KEY_DERIVED_KEY,
} from "@/core/constants.ts";
import { arrayBufferToBase64, base64ToArrayBuffer } from "@/core/crypto.ts";
import { ResultAsync } from "neverthrow";
import { setSettingsStore } from "@/core/store.ts";
import { notifyBackground } from "@/core/messaging.ts";
import type {
  VaultTimeoutAction,
  VaultTimeoutValue,
} from "@/core/storage-schemas.ts";

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
