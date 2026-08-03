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

// --- Branded (Nominal) Types for Domain Identifiers ---
export const ItemIdSchema = z.string().brand<"ItemId">();
export type ItemId = z.infer<typeof ItemIdSchema>;

export const FolderIdSchema = z.string().brand<"FolderId">();
export type FolderId = z.infer<typeof FolderIdSchema>;

export const UserIdSchema = z.string().brand<"UserId">();
export type UserId = z.infer<typeof UserIdSchema>;

export function toItemId(id: string): ItemId {
  return ItemIdSchema.parse(id);
}

export function toFolderId(id: string): FolderId {
  return FolderIdSchema.parse(id);
}

export function toUserId(id: string): UserId {
  return UserIdSchema.parse(id);
}
