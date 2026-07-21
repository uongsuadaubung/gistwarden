import { z } from "zod";
import { VaultTimeoutActionSchema } from "@/core/types.ts";
import {
  SupportLanguage,
  SupportLanguageSchema,
  type TranslationKey,
} from "@/core/i18n.ts";
import { err, Result, ResultAsync } from "neverthrow";

export const GithubUserSchema = z.object({
  login: z.string(),
  avatar_url: z.string(),
});

export type GithubUser = z.infer<typeof GithubUserSchema>;

export const SettingsSchema = z.object({
  githubTokenEncrypted: z.string().default(""),
  githubTokenIv: z.string().default(""),
  gistId: z.string().default(""),
  salt: z.string().default(""),
  lastSync: z.number().default(0),
  lastSyncedHash: z.string().default(""),
  cachedGithubUser: GithubUserSchema.nullable().default(null),
  language: SupportLanguageSchema.default(SupportLanguage.En),
  welcomeAccepted: z.boolean().default(false),
  // PIN settings
  pinUnlockEnabled: z.boolean().default(false),
  pinUnlockValue: z.string().default(""),
  pinUnlockIv: z.string().default(""),
  pinUnlockSalt: z.string().default(""),
  requireMasterPasswordOnRestart: z.boolean().default(true),
  // Session timeout settings
  vaultTimeout: z.string().default("onRestart"),
  vaultTimeoutAction: VaultTimeoutActionSchema.default("lock"),
  timeOffset: z.number().default(0),
});

export type AppSettings = z.infer<typeof SettingsSchema>;

import {
  APP_NAME,
  SESSION_KEY_GITHUB_TOKEN,
  SESSION_KEY_SESSION_UNLOCKED,
} from "@/core/constants.ts";

export const STORAGE_KEY = `${APP_NAME.toLowerCase()}_settings`;

function isRecord(value: unknown): value is Record<string, unknown> {
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

export function hasAlarms(): boolean {
  return typeof chrome !== "undefined" && !!chrome.alarms;
}

export async function getAllSettings(): Promise<AppSettings> {
  if (!hasLocalStorage()) {
    return SettingsSchema.parse({});
  }
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY];
  return SettingsSchema.parse(raw || {});
}

export async function updateSettings(
  patch: Partial<AppSettings>,
): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  const current = await getAllSettings();
  const next = { ...current, ...patch };
  const safeNext = SettingsSchema.parse(next);
  return await ResultAsync.fromPromise(
    chrome.storage.local.set({ [STORAGE_KEY]: safeNext }),
    (_e): TranslationKey => "storage_error",
  );
}

export async function getSessionItem(key: string): Promise<unknown> {
  if (!hasSessionStorage()) {
    return null;
  }
  const result = await ResultAsync.fromPromise(
    chrome.storage.session.get(key),
    (e) => e,
  );
  if (result.isErr()) return null;
  const res = result.value;
  if (isRecord(res) && key in res) {
    return res[key];
  }
  return null;
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
): Promise<Record<string, unknown>> {
  if (!hasSessionStorage()) {
    return {};
  }
  const result = await ResultAsync.fromPromise(
    chrome.storage.session.get(keys),
    (e) => e,
  );
  if (result.isErr()) return {};
  const res = result.value;
  return isRecord(res) ? res : {};
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

export async function getGithubToken(): Promise<string> {
  const sessionToken = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  return typeof sessionToken === "string" ? sessionToken : "";
}

export async function isSessionUnlocked(): Promise<boolean> {
  const val = await getSessionItem(SESSION_KEY_SESSION_UNLOCKED);
  return val === "true";
}

export async function setSessionUnlocked(unlocked: boolean): Promise<void> {
  if (unlocked) {
    await setSessionItem(SESSION_KEY_SESSION_UNLOCKED, "true");
  } else {
    await removeSessionItem(SESSION_KEY_SESSION_UNLOCKED);
  }
}

export function subscribeToSettings(callback: (settings: AppSettings) => void) {
  if (!hasStorageOnChanged()) {
    return;
  }
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      const newValue = changes[STORAGE_KEY].newValue;
      if (newValue) {
        const parsedResult = Result.fromThrowable(
          () => SettingsSchema.parse(newValue),
          (e) => e,
        )();
        if (parsedResult.isOk()) {
          callback(parsedResult.value);
        } else {
          console.error(
            "[Storage] Failed to parse updated settings:",
            parsedResult.error,
          );
        }
      }
    }
  });
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

export async function getLocalItem(key: string): Promise<unknown> {
  if (!hasLocalStorage()) {
    return null;
  }
  const result = await ResultAsync.fromPromise(
    chrome.storage.local.get(key),
    (e) => e,
  );
  if (result.isErr()) return null;
  const res = result.value;
  if (isRecord(res) && key in res) {
    return res[key];
  }
  return null;
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

export async function clearAlarm(
  name: string,
): Promise<Result<boolean, TranslationKey>> {
  if (!hasAlarms()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    chrome.alarms.clear(name),
    (_e): TranslationKey => "storage_error",
  );
}
