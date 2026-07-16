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
}

export enum VaultItemType {
  Login = 1,
  SecureNote = 2,
}

// 1. URIs
export const LoginUriSchema = z.object({
  uri: z.string(),
});
export type LoginUri = z.infer<typeof LoginUriSchema>;

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
export const VaultFieldSchema = z.object({
  type: z.number().default(0),
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
  }),
});
export type LoginVaultItem = z.infer<typeof LoginVaultItemSchema>;

// 6. Secure Note Vault Item Schema
export const SecureNoteVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.SecureNote),
});
export type SecureNoteVaultItem = z.infer<typeof SecureNoteVaultItemSchema>;

// 7. Discriminated Union for Vault Items
export const VaultItemSchema = z.discriminatedUnion("type", [
  LoginVaultItemSchema,
  SecureNoteVaultItemSchema,
]);
export type VaultItem = z.infer<typeof VaultItemSchema>;

export const VaultListSchema = z.array(VaultItemSchema);
export type VaultList = z.infer<typeof VaultListSchema>;

// 8. Import Schemas
export const ImportLoginItemSchema = z.object({
  type: z.literal(VaultItemType.Login),
  name: z.string(),
  notes: z.string().nullish(),
  favorite: z.boolean(),
  fields: z.array(VaultFieldSchema).nullish(),
  login: z.object({
    username: z.string().nullish(),
    password: z.string().nullish(),
    totp: z.string().nullish(),
    uris: z.array(z.object({ uri: z.string() })).nullish(),
    fido2Credentials: z.array(Fido2CredentialSchema).nullish(),
  }),
});

export const ImportSecureNoteItemSchema = z.object({
  type: z.literal(VaultItemType.SecureNote),
  name: z.string(),
  notes: z.string().nullish(),
  favorite: z.boolean(),
  fields: z.array(VaultFieldSchema).nullish(),
  secureNote: z.object({
    type: z.number(),
  }).nullish(),
});

export const ImportItemSchema = z.discriminatedUnion("type", [
  ImportLoginItemSchema,
  ImportSecureNoteItemSchema,
]);
export type ImportItem = z.infer<typeof ImportItemSchema>;

export const ImportArraySchema = z.array(ImportItemSchema);
export const ImportObjectSchema = z.object({
  items: z.array(ImportItemSchema),
});
