import { z } from "zod";
import {
  CustomFieldType,
  VaultItemType,
} from "@/features/vault/vault-types.ts";
import { Fido2CredentialSchema } from "@/features/passkey/fido2-schemas.ts";

export enum UriMatchMode {
  Domain = 0,
  Host = 1,
  StartsWith = 2,
  Exact = 3,
  Regex = 4,
  Never = 5,
}

export const UriMatchModeSchema = z.nativeEnum(UriMatchMode);

export const LoginUriSchema = z.object({
  uri: z.string(),
  match: UriMatchModeSchema.nullish(),
});
export type LoginUri = z.infer<typeof LoginUriSchema>;

export const PasswordHistorySchema = z.object({
  lastUsedDate: z.string().nullish(),
  password: z.string().nullish(),
});
export type PasswordHistory = z.infer<typeof PasswordHistorySchema>;

export const CustomFieldTypeSchema = z.nativeEnum(CustomFieldType);

export const VaultFieldSchema = z.object({
  type: CustomFieldTypeSchema.default(CustomFieldType.Text),
  name: z.string().or(z.null()).optional().transform((v) => v || ""),
  value: z.string().or(z.null()).optional().transform((v) => v || ""),
});
export type VaultField = z.infer<typeof VaultFieldSchema>;

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

export const SecureNoteVaultItemSchema = BaseVaultItemSchema.extend({
  type: z.literal(VaultItemType.SecureNote),
});
export type SecureNoteVaultItem = z.infer<typeof SecureNoteVaultItemSchema>;

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

export const VaultItemSchema = z.discriminatedUnion("type", [
  LoginVaultItemSchema,
  SecureNoteVaultItemSchema,
  CardVaultItemSchema,
  IdentityVaultItemSchema,
  SshKeyVaultItemSchema,
]);
export type VaultItem = z.infer<typeof VaultItemSchema>;

export const VaultListSchema = z.array(VaultItemSchema);
export type VaultList = z.infer<typeof VaultListSchema>;
