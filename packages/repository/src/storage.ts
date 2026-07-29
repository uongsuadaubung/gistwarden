import {
  base64ToArrayBuffer,
  decryptData,
  logger,
  SESSION_KEY_DERIVED_KEY,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
  SESSION_KEY_SESSION_UNLOCKED,
  SESSION_KEYS_ON_LOCK,
  sessionManager,
  STORAGE_KEY_ACCOUNT_SETTINGS,
  STORAGE_KEY_EXTENSION_SETTINGS,
  STORAGE_KEY_PASSWORD_HISTORY,
  type TranslationKey,
} from "@gistwarden/domain";
import { err, ok, Result } from "neverthrow";
import {
  type AccountSettings,
  AccountSettingsSchema,
  type ExtensionSettings,
  ExtensionSettingsSchema,
  type GeneratedPasswordHistoryItem,
  GeneratedPasswordHistoryListSchema,
} from "./storage-schemas.ts";

export {
  DEFAULT_GITHUB_CONFIG,
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_PIN_CONFIG,
} from "./storage-schemas.ts";

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
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  const currentRes = await getExtensionSettings();
  const current = currentRes.isOk()
    ? currentRes.value
    : ExtensionSettingsSchema.parse({});
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
  if (!rawRes.value || typeof rawRes.value !== "object") {
    return err("storage_error");
  }
  const parsed = AccountSettingsSchema.safeParse(rawRes.value);
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
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  await removeLocalItem(STORAGE_KEY_ACCOUNT_SETTINGS);
  await clearSession();
  return ok();
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
  try {
    const res = await chrome.storage.session.get(key);
    if (isRecord(res) && key in res) {
      return ok(res[key]);
    }
    return ok(null);
  } catch (e) {
    logger.storage.error(`Failed to get session item '${key}':`, e);
    return err("storage_error");
  }
}

export async function setSessionItem(
  key: string,
  value: unknown,
): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  try {
    await chrome.storage.session.set({ [key]: value });
    return ok();
  } catch (e) {
    logger.storage.error(`Failed to set session item '${key}':`, e);
    return err("storage_error");
  }
}

export async function getSessionItems(
  keys: string[],
): Promise<Result<Record<string, unknown>, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  try {
    const res = await chrome.storage.session.get(keys);
    if (isRecord(res)) {
      return ok(res);
    }
    return ok({});
  } catch {
    return err("storage_error");
  }
}

export async function setSessionItems(
  items: Record<string, unknown>,
): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  try {
    await chrome.storage.session.set(items);
    return ok();
  } catch {
    return err("storage_error");
  }
}

export async function removeSessionItem(
  keys: string | string[],
): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  try {
    await chrome.storage.session.remove(keys);
    return ok();
  } catch {
    return err("storage_error");
  }
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
  try {
    await chrome.storage.session.setAccessLevel({ accessLevel });
    return ok();
  } catch (e) {
    logger.storage.warn(
      "[Storage] Failed to set session storage access level:",
      e,
    );
    return err("storage_error");
  }
}

export async function clearUnlockedSessionState(): Promise<
  Result<void, TranslationKey>
> {
  sessionManager.clearKey();
  return await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
}

export async function getGithubToken(): Promise<string> {
  const accRes = await getAccountSettings();
  if (accRes.isOk()) {
    const acc = accRes.value;
    const githubConfig = acc.githubConfig;
    if (githubConfig.githubTokenEncrypted && githubConfig.githubTokenIv) {
      let key = sessionManager.getKey();
      if (!key) {
        const base64Res = await getSessionItem(SESSION_KEY_DERIVED_KEY);
        const base64 = base64Res.isOk() ? base64Res.value : null;
        if (typeof base64 === "string" && base64) {
          const bufferRes = base64ToArrayBuffer(base64);
          if (bufferRes.isOk()) {
            try {
              key = await crypto.subtle.importKey(
                "raw",
                bufferRes.value,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"],
              );
              sessionManager.setKey(key);
            } catch (e) {
              logger.storage.error(
                "Failed to import session key for github token:",
                e,
              );
            }
          }
        }
      }
      if (key) {
        const decryptRes = await decryptData(
          githubConfig.githubTokenEncrypted,
          githubConfig.githubTokenIv,
          key,
        );
        if (decryptRes.isOk()) {
          return decryptRes.value;
        }
      }
    }
  }

  // Fallback: If Master Password is not yet created/unlocked, retrieve pending token from session storage
  const pendingRes = await getSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
  if (
    pendingRes.isOk() && typeof pendingRes.value === "string" &&
    pendingRes.value
  ) {
    return pendingRes.value;
  }

  return "";
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
  try {
    await chrome.storage.local.clear();
    return ok();
  } catch (e) {
    logger.storage.error("Failed to clear local storage:", e);
    return err("storage_error");
  }
}

export async function clearSession(): Promise<Result<void, TranslationKey>> {
  if (!hasSessionStorage()) {
    return err("storage_error");
  }
  try {
    await chrome.storage.session.clear();
    return ok();
  } catch (e) {
    logger.storage.error("Failed to clear session storage:", e);
    return err("storage_error");
  }
}

export async function getLocalItem(
  key: string,
): Promise<Result<unknown, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  try {
    const res = await chrome.storage.local.get(key);
    if (isRecord(res) && key in res) {
      return ok(res[key]);
    }
    return ok(null);
  } catch (e) {
    logger.storage.error(`Failed to get local item '${key}':`, e);
    return err("storage_error");
  }
}

export async function setLocalItem(
  key: string,
  value: unknown,
): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  try {
    await chrome.storage.local.set({ [key]: value });
    return ok();
  } catch (e) {
    logger.storage.error(`Failed to set local item '${key}':`, e);
    return err("storage_error");
  }
}

export async function removeLocalItem(
  keys: string | string[],
): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  try {
    await chrome.storage.local.remove(keys);
    return ok();
  } catch (e) {
    logger.storage.error("Failed to remove local item:", e);
    return err("storage_error");
  }
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
