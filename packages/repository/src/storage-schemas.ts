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
  vaultTimeout: VaultTimeoutValueSchema.default("onRestart"),
  vaultTimeoutAction: VaultTimeoutActionSchema.default("lock"),
  timeOffset: z.number().default(0),
  autoSubmitOnAutofill: z.boolean().default(true),
  showAutofillSuggestionsOnFocus: z.boolean().default(true),
  enablePageAnimations: z.boolean().default(true),
});
export type ExtensionSettings = z.infer<typeof ExtensionSettingsSchema>;

export const PinUnlockConfigSchema = z.object({
  enabled: z.boolean().default(false),
  value: z.string().default(""),
  iv: z.string().default(""),
  salt: z.string().default(""),
  failedAttempts: z.number().default(0),
  failedMac: z.string().default(""),
});
export type PinUnlockConfig = z.infer<typeof PinUnlockConfigSchema>;

export const DEFAULT_PIN_CONFIG: PinUnlockConfig = Object.freeze({
  enabled: false,
  value: "",
  iv: "",
  salt: "",
  failedAttempts: 0,
  failedMac: "",
});

export const MasterPasswordSecurityConfigSchema = z.object({
  salt: z.string().default(""),
  failedAttempts: z.number().default(0),
  lockoutUntil: z.number().default(0),
  failedMac: z.string().default(""),
});
export type MasterPasswordSecurityConfig = z.infer<
  typeof MasterPasswordSecurityConfigSchema
>;

export const DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG:
  MasterPasswordSecurityConfig = Object.freeze({
    salt: "",
    failedAttempts: 0,
    lockoutUntil: 0,
    failedMac: "",
  });

export const GithubConfigSchema = z.object({
  gistId: z.string().default(""),
  githubTokenEncrypted: z.string().default(""),
  githubTokenIv: z.string().default(""),
  username: z.string().default(""),
  avatarUrl: z.string().default(""),
});
export type GithubConfig = z.infer<typeof GithubConfigSchema>;

export const DEFAULT_GITHUB_CONFIG: GithubConfig = Object.freeze({
  gistId: "",
  githubTokenEncrypted: "",
  githubTokenIv: "",
  username: "",
  avatarUrl: "",
});

export const AccountSettingsSchema = z.object({
  githubConfig: GithubConfigSchema.default(DEFAULT_GITHUB_CONFIG),
  lastSync: z.number().default(0),
  pinConfig: PinUnlockConfigSchema.default(DEFAULT_PIN_CONFIG),
  masterPasswordConfig: MasterPasswordSecurityConfigSchema.default(
    DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  ),
});
export type AccountSettings = z.infer<typeof AccountSettingsSchema>;
