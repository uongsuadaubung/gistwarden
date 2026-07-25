import {
  SESSION_KEY_SESSION_UNLOCKED,
  SESSION_KEYS_ON_LOCK,
  STORAGE_KEY_ACCOUNT_SETTINGS,
  STORAGE_KEY_EXTENSION_SETTINGS,
  STORAGE_KEY_PASSWORD_HISTORY,
} from "@/core/constants.ts";

import {
  type GeneratedPasswordHistoryItem,
  GeneratedPasswordHistoryListSchema,
} from "@/features/sync/sync-schemas.ts";

import type { TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { clearDerivedKey, decryptData, getSessionKey } from "@/core/crypto.ts";
import {
  accountStore,
  initialAccountState,
  initialExtensionSettings,
  resetAccountStore,
  resetUiStore,
  setAccountStore,
  setSettingsStore,
} from "@/core/store.ts";

import {
  type AccountSettings,
  AccountSettingsSchema,
  type ExtensionSettings,
  ExtensionSettingsSchema,
} from "@/core/storage-schemas.ts";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function hasLocalStorage(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage &&
    !!chrome.storage.local;
}

export function hasSessionStorage(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage &&
    !!chrome.storage.session;
}

export function hasStorageOnChanged(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage &&
    !!chrome.storage.onChanged;
}

// ----------------------------------------------------
// Extension Settings (Persistent across logout)
// ----------------------------------------------------
export async function getExtensionSettings(): Promise<
  Result<ExtensionSettings, TranslationKey>
> {
  const rawRes = await getLocalItem(STORAGE_KEY_EXTENSION_SETTINGS);
  if (rawRes.isErr()) {
    return err(rawRes.error);
  }
  const raw = rawRes.value || {};
  const parsed = ExtensionSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return err("storage_error");
  }
  return ok(parsed.data);
}

export async function updateExtensionSettings(
  patch: Partial<ExtensionSettings>,
): Promise<Result<void, TranslationKey>> {
  setSettingsStore(patch);
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  const currentRes = await getExtensionSettings();
  const current = currentRes.isOk()
    ? currentRes.value
    : ExtensionSettingsSchema.parse(initialExtensionSettings);
  const next = { ...current, ...patch };
  const safeNext = ExtensionSettingsSchema.parse(next);
  return await setLocalItem(STORAGE_KEY_EXTENSION_SETTINGS, safeNext);
}

// ----------------------------------------------------
// Account Settings (Wiped on logout)
// ----------------------------------------------------
export async function getAccountSettings(): Promise<
  Result<AccountSettings, TranslationKey>
> {
  const rawRes = await getLocalItem(STORAGE_KEY_ACCOUNT_SETTINGS);
  if (rawRes.isErr()) {
    return err(rawRes.error);
  }
  const raw = rawRes.value || {};
  const parsed = AccountSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return err("storage_error");
  }
  return ok(parsed.data);
}

export async function updateAccountSettings(
  patch: Partial<AccountSettings>,
): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  const currentRes = await getAccountSettings();
  const current = currentRes.isOk()
    ? currentRes.value
    : AccountSettingsSchema.parse({});
  const next = { ...current, ...patch };
  const safeNext = AccountSettingsSchema.parse(next);
  return await setLocalItem(STORAGE_KEY_ACCOUNT_SETTINGS, safeNext);
}

// Reset account store and storage (Logout)
export async function resetAccountSettings(): Promise<
  Result<void, TranslationKey>
> {
  resetAccountStore();
  resetUiStore();
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  await removeLocalItem(STORAGE_KEY_ACCOUNT_SETTINGS);
  await clearSession();
  return ok();
}

// Helper function to load all settings into SolidJS stores
export async function loadAllStores(): Promise<void> {
  const extRes = await getExtensionSettings();
  if (extRes.isOk()) {
    setSettingsStore({
      ...extRes.value,
      isLoaded: true,
    });
  } else {
    setSettingsStore({
      ...initialExtensionSettings,
      isLoaded: true,
    });
  }

  const accRes = await getAccountSettings();
  if (accRes.isOk()) {
    const acc = accRes.value;
    setAccountStore({
      gistId: acc.gistId,
      salt: acc.salt,
      lastSync: acc.lastSync,
      cachedGithubUser: acc.cachedGithubUser,
      pinUnlockEnabled: acc.pinUnlockEnabled,
      pinUnlockValue: acc.pinUnlockValue,
      pinUnlockIv: acc.pinUnlockIv,
      pinUnlockSalt: acc.pinUnlockSalt,
      githubConfigured: !!acc.gistId && !!acc.salt,
      isLoaded: true,
    });
  } else {
    setAccountStore({
      ...initialAccountState,
      isLoaded: true,
    });
  }
}

// ----------------------------------------------------
// Session Storage & Crypto Helpers
// ----------------------------------------------------
export async function getSessionItem(
  key: string,
): Promise<Result<unknown, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  const result = await ResultAsync.fromPromise(
    chrome.storage.session.get(key),
    (_e): TranslationKey => "storage_error",
  );
  if (result.isErr()) return err(result.error);
  const res = result.value;
  if (isRecord(res) && key in res) {
    return ok(res[key]);
  }
  return ok(null);
}

export async function setSessionItem(
  key: string,
  value: unknown,
): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.storage.session.set({ [key]: value }),
    (_e): TranslationKey => "storage_error",
  );
}

export async function getSessionItems(
  keys: string[],
): Promise<Result<Record<string, unknown>, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  const result = await ResultAsync.fromPromise(
    chrome.storage.session.get(keys),
    (_e): TranslationKey => "storage_error",
  );
  if (result.isErr()) return err(result.error);
  const res = result.value;
  if (isRecord(res)) {
    return ok(res);
  }
  return ok({});
}

export async function setSessionItems(
  items: Record<string, unknown>,
): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.storage.session.set(items),
    (_e): TranslationKey => "storage_error",
  );
}

export async function removeSessionItem(
  keys: string | string[],
): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.storage.session.remove(keys),
    (_e): TranslationKey => "storage_error",
  );
}

export async function configureSessionAccessLevel(
  accessLevel: "TRUSTED_CONTEXTS" | "TRUSTED_AND_UNTRUSTED_CONTEXTS" =
    "TRUSTED_CONTEXTS",
): Promise<Result<void, TranslationKey>> {
  if (
    typeof chrome === "undefined" ||
    !chrome.storage?.session?.setAccessLevel
  ) {
    return ok();
  }
  return await ResultAsync.fromPromise(
    chrome.storage.session.setAccessLevel({ accessLevel }),
    (e): TranslationKey => {
      console.warn("[Storage] Failed to set session storage access level:", e);
      return "storage_error";
    },
  );
}

export async function clearUnlockedSessionState(): Promise<
  Result<void, TranslationKey>
> {
  clearDerivedKey();
  return await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
}

export async function getGithubToken(): Promise<string> {
  const accRes = await getAccountSettings();
  if (accRes.isOk()) {
    const acc = accRes.value;
    if (acc.githubTokenEncrypted && acc.githubTokenIv) {
      const key = await getSessionKey();
      if (key) {
        const decryptRes = await decryptData(
          acc.githubTokenEncrypted,
          acc.githubTokenIv,
          key,
        );
        if (decryptRes.isOk()) {
          return decryptRes.value;
        }
      }
    }
  }
  return accountStore.githubToken || "";
}

export async function isSessionUnlocked(): Promise<boolean> {
  const res = await getSessionItem(SESSION_KEY_SESSION_UNLOCKED);
  const val = res.isOk() ? res.value : null;
  return val === "true";
}

export async function setSessionUnlocked(unlocked: boolean): Promise<void> {
  if (unlocked) {
    await setSessionItem(SESSION_KEY_SESSION_UNLOCKED, "true");
  } else {
    await removeSessionItem(SESSION_KEY_SESSION_UNLOCKED);
  }
}

export async function clearLocal(): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.storage.local.clear(),
    (_e): TranslationKey => "storage_error",
  );
}

export async function clearSession(): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.storage.session.clear(),
    (_e): TranslationKey => "storage_error",
  );
}

export async function getLocalItem(
  key: string,
): Promise<Result<unknown, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  const result = await ResultAsync.fromPromise(
    chrome.storage.local.get(key),
    (_e): TranslationKey => "storage_error",
  );
  if (result.isErr()) return err(result.error);
  const res = result.value;
  if (isRecord(res) && key in res) {
    return ok(res[key]);
  }
  return ok(null);
}

export async function setLocalItem(
  key: string,
  value: unknown,
): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.storage.local.set({ [key]: value }),
    (_e): TranslationKey => "storage_error",
  );
}

export async function removeLocalItem(
  keys: string | string[],
): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.storage.local.remove(keys),
    (_e): TranslationKey => "storage_error",
  );
}

export async function getPasswordHistory(): Promise<
  Result<GeneratedPasswordHistoryItem[], TranslationKey>
> {
  const rawRes = await getLocalItem(STORAGE_KEY_PASSWORD_HISTORY);
  if (rawRes.isErr()) {
    return err(rawRes.error);
  }
  const raw = rawRes.value ?? [];
  const parsed = GeneratedPasswordHistoryListSchema.safeParse(raw);
  if (!parsed.success) {
    return ok([]);
  }
  return ok(parsed.data);
}

export async function addPasswordHistoryItem(
  item: GeneratedPasswordHistoryItem,
): Promise<Result<void, TranslationKey>> {
  const currentRes = await getPasswordHistory();
  const history = currentRes.isOk() ? currentRes.value : [];
  if (history.some((h) => h.password === item.password)) {
    return ok();
  }
  const updated = [item, ...history].slice(0, 10);
  return await setLocalItem(STORAGE_KEY_PASSWORD_HISTORY, updated);
}

export async function clearPasswordHistory(): Promise<
  Result<void, TranslationKey>
> {
  return await setLocalItem(STORAGE_KEY_PASSWORD_HISTORY, []);
}
