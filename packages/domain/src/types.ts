import { z } from "zod";

export enum View {
  Login = "Login",
  Vault = "Vault",
  ItemDetail = "ItemDetail",
  ItemEdit = "ItemEdit",
  Generator = "Generator",
  Settings = "Settings",
  Fido2Prompt = "Fido2Prompt",
  VaultOptions = "VaultOptions",
  Language = "Language",
  Theme = "Theme",
  Appearance = "Appearance",
  About = "About",
  Troubleshooting = "Troubleshooting",
  Welcome = "Welcome",
  AccountSecurity = "AccountSecurity",
  ChangeMasterPassword = "ChangeMasterPassword",
  ImportAccounts = "ImportAccounts",
  ExportAccounts = "ExportAccounts",
  AutofillOptions = "AutofillOptions",
  PasswordHistory = "PasswordHistory",
  Trash = "Trash",
  Folders = "Folders",
  Reports = "Reports",
  ReportExposed = "ReportExposed",
  ReportReused = "ReportReused",
  ReportWeak = "ReportWeak",
  ReportUnsecure = "ReportUnsecure",
  ReportInactive2FA = "ReportInactive2FA",
  ReportDataBreach = "ReportDataBreach",
}

export enum SupportLanguage {
  En = "en",
  Vi = "vi",
}

export const SupportLanguageSchema = z.enum(["en", "vi"]);

export enum ThemeMode {
  Dark = "dark",
  Light = "light",
}

export function createSuccessPayloadResponseSchema<T extends z.ZodTypeAny>(
  payloadSchema: T,
) {
  return z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      payload: payloadSchema,
    }),
    z.object({
      success: z.literal(false),
      error: z.string().optional(),
    }),
  ]);
}
