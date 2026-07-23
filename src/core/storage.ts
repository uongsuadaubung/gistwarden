import { z } from "zod";
import {
  SupportLanguage,
  SupportLanguageSchema,
  VaultTimeoutActionSchema,
} from "@/core/types.ts";
import type { TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result, ResultAsync } from "neverthrow";

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

export async function getAllSettings(): Promise<
  Result<AppSettings, TranslationKey>
> {
  const rawRes = await getLocalItem(STORAGE_KEY);
  if (rawRes.isErr()) {
    return err(rawRes.error);
  }
  const raw = rawRes.value || {};
  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return err("storage_error");
  }
  return ok(parsed.data);
}

export async function updateSettings(
  patch: Partial<AppSettings>,
): Promise<Result<void, TranslationKey>> {
  if (!hasLocalStorage()) {
    return err("storage_error");
  }
  const currentRes = await getAllSettings();
  if (currentRes.isErr()) {
    return err("storage_error");
  }
  const current = currentRes.value;
  const next = { ...current, ...patch };
  const safeNext = SettingsSchema.parse(next);
  return await setLocalItem(STORAGE_KEY, safeNext);
}

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

export async function getGithubToken(): Promise<string> {
  const res = await getSessionItem(SESSION_KEY_GITHUB_TOKEN);
  const sessionToken = res.isOk() ? res.value : null;
  return typeof sessionToken === "string" ? sessionToken : "";
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

export function subscribeToSettings(callback: (settings: AppSettings) => void) {
  if (!hasStorageOnChanged()) {
    return;
  }
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      const newValue = changes[STORAGE_KEY].newValue;
      if (newValue) {
        const parsedResult = SettingsSchema.safeParse(newValue);
        if (parsedResult.success) {
          callback(parsedResult.data);
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

export async function createAlarm(
  name: string,
  alarmInfo: chrome.alarms.AlarmCreateInfo,
): Promise<Result<void, TranslationKey>> {
  if (!hasAlarms()) {
    return err("storage_error");
  }
  return await ResultAsync.fromPromise(
    Promise.resolve(chrome.alarms.create(name, alarmInfo)),
    (_e): TranslationKey => "storage_error",
  );
}
