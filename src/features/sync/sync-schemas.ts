import { z } from "zod";
import { VaultItemType } from "@/features/vault/vault-types.ts";
import { VaultFieldSchema } from "@/features/vault/vault-schemas.ts";
import { Fido2CredentialSchema } from "@/features/passkey/fido2-schemas.ts";

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

export const GistPayloadSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
  salt: z.string().optional(),
});
export type GistPayload = z.infer<typeof GistPayloadSchema>;

export const EncryptedPayloadSchema = GistPayloadSchema.partial();
export type EncryptedPayload = z.infer<typeof EncryptedPayloadSchema>;

export const GistContentPayloadSchema = EncryptedPayloadSchema.extend({
  rawContent: z.string(),
});
export type GistContentPayload = z.infer<typeof GistContentPayloadSchema>;
