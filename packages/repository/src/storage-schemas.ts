import { z } from "zod";
import { SupportLanguage, ThemeMode } from "@gistwarden/domain";

export const SupportLanguageSchema = z.enum(["en", "vi"]);

export const ToastTypeSchema = z.enum(["success", "error", "info"]);
export type ToastType = z.infer<typeof ToastTypeSchema>;

export const ConfirmTypeSchema = z.enum(["info", "warning", "danger"]);
export type ConfirmType = z.infer<typeof ConfirmTypeSchema>;

export const GeneratedPasswordHistoryItemSchema = z.object({
  password: z.string(),
  copiedAt: z.number(),
  domain: z.string(),
});
export type GeneratedPasswordHistoryItem = z.infer<
  typeof GeneratedPasswordHistoryItemSchema
>;

export const GeneratedPasswordHistoryListSchema = z.array(
  GeneratedPasswordHistoryItemSchema,
);
export type GeneratedPasswordHistoryList = z.infer<
  typeof GeneratedPasswordHistoryListSchema
>;

export const VaultTimeoutActionSchema = z.enum(["lock", "logout"]);
export type VaultTimeoutAction = z.infer<typeof VaultTimeoutActionSchema>;

export const VaultTimeoutValueSchema = z.enum([
  "onSystemLock",
  "onRestart",
  "1",
  "5",
  "15",
  "30",
  "60",
  "240",
]);
export type VaultTimeoutValue = z.infer<typeof VaultTimeoutValueSchema>;

export const ThemeModeSchema = z.enum(["dark", "light"]);
export type ThemeModeType = z.infer<typeof ThemeModeSchema>;

export const LoginMethodSchema = z.enum(["oauth", "pat"]);
export type LoginMethod = z.infer<typeof LoginMethodSchema>;

export const LoginViewModeSchema = z.enum(["masterPassword", "pin"]);
export type LoginViewMode = z.infer<typeof LoginViewModeSchema>;

export const GithubUserSchema = z.object({
  login: z.string(),
  avatar_url: z.string(),
});
export type GithubUser = z.infer<typeof GithubUserSchema>;

export const ExtensionSettingsSchema = z.object({
  language: SupportLanguageSchema.default(SupportLanguage.En),
  welcomeAccepted: z.boolean().default(false),
  theme: z.nativeEnum(ThemeMode).default(ThemeMode.Dark),
  requireMasterPasswordOnRestart: z.boolean().default(true),
  vaultTimeout: VaultTimeoutValueSchema.default("onSystemLock"),
  vaultTimeoutAction: VaultTimeoutActionSchema.default("lock"),
  timeOffset: z.number().default(0),
  autoSubmitOnAutofill: z.boolean().default(true),
  showAutofillSuggestionsOnFocus: z.boolean().default(true),
  enablePageAnimations: z.boolean().default(true),
});
export type ExtensionSettings = z.infer<typeof ExtensionSettingsSchema>;

export const AccountSettingsSchema = z.object({
  githubTokenEncrypted: z.string().default(""),
  githubTokenIv: z.string().default(""),
  gistId: z.string().default(""),
  salt: z.string().default(""),
  lastSync: z.number().default(0),
  lastSyncedHash: z.string().default(""),
  cachedGithubUser: GithubUserSchema.nullable().default(null),
  pinUnlockEnabled: z.boolean().default(false),
  pinUnlockValue: z.string().default(""),
  pinUnlockIv: z.string().default(""),
  pinUnlockSalt: z.string().default(""),
});
export type AccountSettings = z.infer<typeof AccountSettingsSchema>;
