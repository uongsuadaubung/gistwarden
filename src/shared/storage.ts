import { z } from "zod";
import { VaultTimeoutActionSchema } from "./types.ts";
import { SupportLanguage, SupportLanguageSchema } from "./i18n.ts";

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
} from "./constants.ts";

export const STORAGE_KEY = `${APP_NAME.toLowerCase()}_settings`;

export async function getAllSettings(): Promise<AppSettings> {
  if (
    typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local
  ) {
    return SettingsSchema.parse({});
  }
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY];
  return SettingsSchema.parse(raw || {});
}

export async function updateSettings(patch: Partial<AppSettings>) {
  if (
    typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local
  ) {
    return;
  }
  const current = await getAllSettings();
  const next = { ...current, ...patch };
  const safeNext = SettingsSchema.parse(next);
  await chrome.storage.local.set({ [STORAGE_KEY]: safeNext });
}

// General Session Storage Helpers
export async function getSessionItem(key: string): Promise<unknown> {
  if (
    typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session
  ) {
    return null;
  }
  try {
    const res = await chrome.storage.session.get(key);
    return res && typeof res === "object" && key in res ? res[key] : null;
  } catch (_e) {
    return null;
  }
}

export async function setSessionItem(
  key: string,
  value: unknown,
): Promise<void> {
  if (
    typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session
  ) {
    return;
  }
  try {
    await chrome.storage.session.set({ [key]: value });
  } catch (_e) {
    // Ignored
  }
}

export async function getSessionItems(
  keys: string[],
): Promise<Record<string, unknown>> {
  if (
    typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session
  ) {
    return {};
  }
  try {
    const res = await chrome.storage.session.get(keys);
    return res && typeof res === "object" ? res : {};
  } catch (_e) {
    return {};
  }
}

export async function setSessionItems(
  items: Record<string, unknown>,
): Promise<void> {
  if (
    typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session
  ) {
    return;
  }
  try {
    await chrome.storage.session.set(items);
  } catch (_e) {
    // Ignored
  }
}

export async function removeSessionItem(
  keys: string | string[],
): Promise<void> {
  if (
    typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session
  ) {
    return;
  }
  try {
    await chrome.storage.session.remove(keys);
  } catch (_e) {
    // Ignored
  }
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
  if (
    typeof chrome === "undefined" ||
    !chrome.storage ||
    !chrome.storage.onChanged
  ) {
    return;
  }
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      const newValue = changes[STORAGE_KEY].newValue;
      if (newValue) {
        try {
          const parsed = SettingsSchema.parse(newValue);
          callback(parsed);
        } catch (e) {
          console.error("[Storage] Failed to parse updated settings:", e);
        }
      }
    }
  });
}
