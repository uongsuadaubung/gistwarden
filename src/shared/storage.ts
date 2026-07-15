import { z } from "zod";

export const GithubUserSchema = z.object({
  login: z.string(),
  avatar_url: z.string(),
});

export type GithubUser = z.infer<typeof GithubUserSchema>;

export const SettingsSchema = z.object({
  githubToken: z.string().default(""),
  gistId: z.string().default(""),
  salt: z.string().default(""),
  lastSync: z.number().default(0),
  lastSyncedHash: z.string().default(""),
  cachedGithubUser: GithubUserSchema.nullable().default(null),
  oauthClientId: z.string().default("Ov23liRxwWqLXD5AOkNW"),
  oauthWorkerUrl: z.string().default("https://gistwarden.uongsuadaubung.workers.dev"),
});

export type AppSettings = z.infer<typeof SettingsSchema>;

export const STORAGE_KEY = "gistwarden_settings";

export async function getAllSettings(): Promise<AppSettings> {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
    return SettingsSchema.parse({});
  }
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const raw = result[STORAGE_KEY];
  return SettingsSchema.parse(raw || {});
}

export async function updateSettings(patch: Partial<AppSettings>) {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
    return;
  }
  const current = await getAllSettings();
  const next = { ...current, ...patch };
  const safeNext = SettingsSchema.parse(next);
  await chrome.storage.local.set({ [STORAGE_KEY]: safeNext });
}

// Session Storage (Master Password in-memory only, cleared on browser close)
export async function getMasterPassword(): Promise<string> {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session) {
    return "";
  }
  try {
    const res = await chrome.storage.session.get("masterPassword");
    if (res && typeof res === "object" && "masterPassword" in res) {
      const val = res.masterPassword;
      return typeof val === "string" ? val : "";
    }
    return "";
  } catch (_e) {
    console.debug("[Storage] Failed to read from session storage (probably not supported yet)");
    return "";
  }
}

export async function setMasterPassword(password: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session) {
    return;
  }
  try {
    await chrome.storage.session.set({ masterPassword: password });
  } catch (e) {
    console.debug("[Storage] Failed to write to session storage:", e);
  }
}

export async function clearMasterPassword(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.session) {
    return;
  }
  try {
    await chrome.storage.session.remove("masterPassword");
  } catch (e) {
    console.debug("[Storage] Failed to clear session storage:", e);
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
