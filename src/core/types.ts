import { z } from "zod";
import type { TranslationKey } from "@/core/i18n.ts";

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
}

export enum VaultItemType {
  Login = 1,
  SecureNote = 2,
  Card = 3,
  Identity = 4,
  SshKey = 5,
}

export enum SupportLanguage {
  En = "en",
  Vi = "vi",
}

export const SupportLanguageSchema = z.enum(["en", "vi"]);

// 1. URIs
export const LoginUriSchema = z.object({
  uri: z.string(),
});
export type LoginUri = z.infer<typeof LoginUriSchema>;

export const PasswordHistorySchema = z.object({
  lastUsedDate: z.string().nullish(),
  password: z.string().nullish(),
});
export type PasswordHistory = z.infer<typeof PasswordHistorySchema>;

// 2. FIDO2 Credentials
export const Fido2CredentialSchema = z.object({
  credentialId: z.string(),
  keyType: z.string(),
  keyAlgorithm: z.string(),
  keyCurve: z.string(),
  keyValue: z.string(),
  rpId: z.string(),
  userHandle: z.string().or(z.null()).optional(),
  userName: z.string().or(z.null()).optional(),
  counter: z.number().or(z.string()).transform((v) => {
    if (typeof v === "string") {
      const parsed = parseInt(v);
      return isNaN(parsed) ? 0 : parsed;
    }
    return v;
  }),
  rpName: z.string().or(z.null()).optional(),
  userDisplayName: z.string().or(z.null()).optional(),
  discoverable: z.boolean().or(z.string()).transform((v) =>
    typeof v === "string" ? v === "true" : v
  ).optional(),
  creationDate: z.string().or(z.date()).transform((v) =>
    v instanceof Date ? v.toISOString() : v
  ).optional(),
});
export type Fido2Credential = z.infer<typeof Fido2CredentialSchema>;

// 3. Custom Fields
export enum CustomFieldType {
  Text = 0,
  Hidden = 1,
  Boolean = 2,
  Linked = 3,
  Divider = 10,
}
export const CustomFieldTypeSchema = z.nativeEnum(CustomFieldType);

export const VaultFieldSchema = z.object({
  type: CustomFieldTypeSchema.default(CustomFieldType.Text),
  name: z.string().or(z.null()).optional().transform((v) => v || ""),
  value: z.string().or(z.null()).optional().transform((v) => v || ""),
});
export type VaultField = z.infer<typeof VaultFieldSchema>;

// 4. Base Vault Item Schema
export const BaseVaultItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().optional(),
  favorite: z.boolean(),
  reprompt: z.number(),
  fields: z.array(VaultFieldSchema),
  creationDate: z.string(),
  revisionDate: z.string(),
});
export type BaseVaultItem = z.infer<typeof BaseVaultItemSchema>;

// 5. Login Vault Item Schema
export const LoginVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.Login),
  login: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    totp: z.string().optional(),
    uris: z.array(LoginUriSchema).optional(),
    fido2Credentials: z.array(Fido2CredentialSchema).optional(),
    passwordRevisionDate: z.string().nullish(),
    passwordHistory: z.array(PasswordHistorySchema).nullish(),
  }),
});
export type LoginVaultItem = z.infer<typeof LoginVaultItemSchema>;

// 6. Secure Note Vault Item Schema
export const SecureNoteVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.SecureNote),
});
export type SecureNoteVaultItem = z.infer<typeof SecureNoteVaultItemSchema>;

// 6b. Card Vault Item Schema
export const CardSchema = z.object({
  cardholderName: z.string().or(z.null()).optional().transform((v) => v || ""),
  brand: z.string().or(z.null()).optional().transform((v) => v || ""),
  number: z.string().or(z.null()).optional().transform((v) => v || ""),
  expMonth: z.string().or(z.null()).optional().transform((v) => v || ""),
  expYear: z.string().or(z.null()).optional().transform((v) => v || ""),
  code: z.string().or(z.null()).optional().transform((v) => v || ""),
});
export type CardDetails = z.infer<typeof CardSchema>;

export const IdentitySchema = z.object({
  title: z.string().or(z.null()).optional().transform((v) => v || ""),
  firstName: z.string().or(z.null()).optional().transform((v) => v || ""),
  middleName: z.string().or(z.null()).optional().transform((v) => v || ""),
  lastName: z.string().or(z.null()).optional().transform((v) => v || ""),
  username: z.string().or(z.null()).optional().transform((v) => v || ""),
  company: z.string().or(z.null()).optional().transform((v) => v || ""),
  ssn: z.string().or(z.null()).optional().transform((v) => v || ""),
  passportNumber: z.string().or(z.null()).optional().transform((v) => v || ""),
  licenseNumber: z.string().or(z.null()).optional().transform((v) => v || ""),
  email: z.string().or(z.null()).optional().transform((v) => v || ""),
  phone: z.string().or(z.null()).optional().transform((v) => v || ""),
  address1: z.string().or(z.null()).optional().transform((v) => v || ""),
  address2: z.string().or(z.null()).optional().transform((v) => v || ""),
  address3: z.string().or(z.null()).optional().transform((v) => v || ""),
  city: z.string().or(z.null()).optional().transform((v) => v || ""),
  state: z.string().or(z.null()).optional().transform((v) => v || ""),
  postalCode: z.string().or(z.null()).optional().transform((v) => v || ""),
  country: z.string().or(z.null()).optional().transform((v) => v || ""),
});
export type IdentityDetails = z.infer<typeof IdentitySchema>;

export const IdentityVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.Identity),
  identity: IdentitySchema,
});
export type IdentityVaultItem = z.infer<typeof IdentityVaultItemSchema>;

export const CardVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.Card),
  card: CardSchema,
});
export type CardVaultItem = z.infer<typeof CardVaultItemSchema>;

export const SshKeySchema = z.object({
  privateKey: z.string().or(z.null()).optional().transform((v) => v || ""),
  publicKey: z.string().or(z.null()).optional().transform((v) => v || ""),
  keyFingerprint: z.string().or(z.null()).optional().transform((v) => v || ""),
});
export type SshKeyDetails = z.infer<typeof SshKeySchema>;

export const SshKeyVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.SshKey),
  sshKey: SshKeySchema,
});
export type SshKeyVaultItem = z.infer<typeof SshKeyVaultItemSchema>;

// 7. Discriminated Union for Vault Items
export const VaultItemSchema = z.discriminatedUnion("type", [
  LoginVaultItemSchema,
  SecureNoteVaultItemSchema,
  CardVaultItemSchema,
  IdentityVaultItemSchema,
  SshKeyVaultItemSchema,
]);
export type VaultItem = z.infer<typeof VaultItemSchema>;

// Type Guards for VaultItem
export const isLoginItem = (item: VaultItem): item is LoginVaultItem => {
  return Number(item.type) === VaultItemType.Login;
};

export const isSecureNoteItem = (
  item: VaultItem,
): item is SecureNoteVaultItem => {
  return Number(item.type) === VaultItemType.SecureNote;
};

export const isCardItem = (item: VaultItem): item is CardVaultItem => {
  return Number(item.type) === VaultItemType.Card;
};

export const isIdentityItem = (item: VaultItem): item is IdentityVaultItem => {
  return Number(item.type) === VaultItemType.Identity;
};

export const isSshKeyItem = (item: VaultItem): item is SshKeyVaultItem => {
  return Number(item.type) === VaultItemType.SshKey;
};

export const VaultListSchema = z.array(VaultItemSchema);
export type VaultList = z.infer<typeof VaultListSchema>;

// 8. Import Schemas
export const ImportLoginItemSchema = z.object({
  id: z.string().nullish(),
  type: z.literal(VaultItemType.Login),
  name: z.string(),
  notes: z.string().nullish(),
  favorite: z.boolean(),
  reprompt: z.number(),
  creationDate: z.string().nullish(),
  revisionDate: z.string().nullish(),
  fields: z.array(VaultFieldSchema).nullish(),
  login: z.object({
    username: z.string().nullish(),
    password: z.string().nullish(),
    totp: z.string().nullish(),
    uris: z.array(z.object({
      uri: z.string(),
      match: z.number().nullish(),
    })).nullish(),
    fido2Credentials: z.array(Fido2CredentialSchema).nullish(),
    passwordRevisionDate: z.string().nullish(),
    passwordHistory: z.array(z.object({
      lastUsedDate: z.string().nullish(),
      password: z.string().nullish(),
    })).nullish(),
  }),
});

export const ImportSecureNoteItemSchema = z.object({
  id: z.string().nullish(),
  type: z.literal(VaultItemType.SecureNote),
  name: z.string(),
  notes: z.string().nullish(),
  favorite: z.boolean(),
  reprompt: z.number(),
  creationDate: z.string().nullish(),
  revisionDate: z.string().nullish(),
  fields: z.array(VaultFieldSchema).nullish(),
  secureNote: z.object({
    type: z.number(),
  }).nullish(),
});

export const ImportCardItemSchema = z.object({
  id: z.string().nullish(),
  type: z.literal(VaultItemType.Card),
  name: z.string(),
  notes: z.string().nullish(),
  favorite: z.boolean(),
  reprompt: z.number(),
  creationDate: z.string().nullish(),
  revisionDate: z.string().nullish(),
  fields: z.array(VaultFieldSchema).nullish(),
  card: z.object({
    cardholderName: z.string().nullish(),
    brand: z.string().nullish(),
    number: z.string().nullish(),
    expMonth: z.string().nullish(),
    expYear: z.string().nullish(),
    code: z.string().nullish(),
  }).nullish(),
});

export const ImportIdentityItemSchema = z.object({
  id: z.string().nullish(),
  type: z.literal(VaultItemType.Identity),
  name: z.string(),
  notes: z.string().nullish(),
  favorite: z.boolean(),
  reprompt: z.number(),
  creationDate: z.string().nullish(),
  revisionDate: z.string().nullish(),
  fields: z.array(VaultFieldSchema).nullish(),
  identity: z.object({
    title: z.string().nullish(),
    firstName: z.string().nullish(),
    middleName: z.string().nullish(),
    lastName: z.string().nullish(),
    username: z.string().nullish(),
    company: z.string().nullish(),
    ssn: z.string().nullish(),
    passportNumber: z.string().nullish(),
    licenseNumber: z.string().nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    address1: z.string().nullish(),
    address2: z.string().nullish(),
    address3: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    postalCode: z.string().nullish(),
    country: z.string().nullish(),
  }).nullish(),
});

export const ImportSshKeyItemSchema = z.object({
  id: z.string().nullish(),
  type: z.literal(VaultItemType.SshKey),
  name: z.string(),
  notes: z.string().nullish(),
  favorite: z.boolean(),
  reprompt: z.number(),
  creationDate: z.string().nullish(),
  revisionDate: z.string().nullish(),
  fields: z.array(VaultFieldSchema).nullish(),
  sshKey: z.object({
    privateKey: z.string().nullish(),
    publicKey: z.string().nullish(),
    keyFingerprint: z.string().nullish(),
  }).nullish(),
});

export const ImportItemSchema = z.discriminatedUnion("type", [
  ImportLoginItemSchema,
  ImportSecureNoteItemSchema,
  ImportCardItemSchema,
  ImportIdentityItemSchema,
  ImportSshKeyItemSchema,
]);
export type ImportItem = z.infer<typeof ImportItemSchema>;

export const ImportArraySchema = z.array(ImportItemSchema);
export const ImportObjectSchema = z.object({
  items: z.array(ImportItemSchema),
});

// Toast Types
export const ToastTypeSchema = z.enum(["success", "error", "info"]);
export type ToastType = z.infer<typeof ToastTypeSchema>;

// Confirm Modal Types
export const ConfirmTypeSchema = z.enum(["info", "warning", "danger"]);
export type ConfirmType = z.infer<typeof ConfirmTypeSchema>;

// Vault Timeout Action Types
export const VaultTimeoutActionSchema = z.enum(["lock", "logout"]);
export type VaultTimeoutAction = z.infer<typeof VaultTimeoutActionSchema>;

// Theme Types
export enum ThemeMode {
  Dark = "dark",
  Light = "light",
}
export const ThemeModeSchema = z.enum(["dark", "light"]);
export type ThemeModeType = z.infer<typeof ThemeModeSchema>;

// Login Method Types
export const LoginMethodSchema = z.enum(["oauth", "pat"]);
export type LoginMethod = z.infer<typeof LoginMethodSchema>;

// Login View Mode Types
export const LoginViewModeSchema = z.enum(["masterPassword", "pin"]);
export type LoginViewMode = z.infer<typeof LoginViewModeSchema>;

// IPC Message Response Schemas
export const ValidateTokenResponseSchema = z.object({
  success: z.boolean(),
  username: z.string().optional(),
  avatarUrl: z.string().optional(),
  error: z.custom<TranslationKey>().optional(),
});
export type ValidateTokenResponse = z.infer<typeof ValidateTokenResponseSchema>;

export const DownloadFromGistResponseSchema = z.object({
  success: z.boolean(),
  content: z.string().optional(),
  error: z.custom<TranslationKey>().optional(),
});
export type DownloadFromGistResponse = z.infer<
  typeof DownloadFromGistResponseSchema
>;

export const GetPendingFido2RequestResponseSchema = z.object({
  success: z.boolean(),
  type: z.enum(["create", "get"]).optional(),
  options: z.object({
    rpId: z.string().optional(),
    rp: z.object({
      id: z.string().optional(),
      name: z.string(),
    }).optional(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      displayName: z.string().optional(),
    }).optional(),
    challenge: z.string(),
    userVerification: z.enum(["required", "preferred", "discouraged"])
      .optional(),
    allowCredentials: z.array(z.object({
      id: z.string(),
      type: z.string(),
    })).optional(),
  }).optional(),
  origin: z.string().optional(),
  error: z.custom<TranslationKey>().optional(),
});
export type GetPendingFido2RequestResponse = z.infer<
  typeof GetPendingFido2RequestResponseSchema
>;

export const GistPayloadSchema = z.object({
  salt: z.string().optional(),
  iv: z.string(),
  ciphertext: z.string(),
});
export type GistPayload = z.infer<typeof GistPayloadSchema>;
