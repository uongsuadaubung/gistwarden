import { z } from "zod";
import type { TranslationKey } from "@/core/i18n.ts";
import { defineRoute } from "@/core/messaging.ts";
import {
  MSG_DELETE_GIST,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_START_GITHUB_OAUTH,
  MSG_UPLOAD_TO_GIST,
  MSG_VALIDATE_TOKEN,
} from "@/core/constants.ts";
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

// --- Sync Extension Message & Response Schemas ---
export const SimpleSuccessResponseSchema = z.object({
  success: z.literal(true),
});
export type SimpleSuccessResponse = z.infer<typeof SimpleSuccessResponseSchema>;

export const SyncActionResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type SyncActionResponse = z.infer<typeof SyncActionResponseSchema>;

export const DownloadGistResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    content: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type DownloadGistResponse = z.infer<typeof DownloadGistResponseSchema>;

export const ValidateTokenResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    username: z.string(),
    avatarUrl: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type ValidateTokenResponse = z.infer<typeof ValidateTokenResponseSchema>;

export const StartGithubOauthResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    token: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type StartGithubOauthResponse = z.infer<
  typeof StartGithubOauthResponseSchema
>;

export const UploadToGistMsgSchema = z.object({
  type: z.literal(MSG_UPLOAD_TO_GIST),
  content: z.string().optional(),
});
export type UploadToGistMsg = z.infer<typeof UploadToGistMsgSchema>;

export const DeleteGistMsgSchema = z.object({
  type: z.literal(MSG_DELETE_GIST),
  content: z.string().optional(),
});
export type DeleteGistMsg = z.infer<typeof DeleteGistMsgSchema>;

export const DownloadFromGistMsgSchema = z.object({
  type: z.literal(MSG_DOWNLOAD_FROM_GIST),
});
export type DownloadFromGistMsg = z.infer<typeof DownloadFromGistMsgSchema>;

export const ValidateTokenMsgSchema = z.object({
  type: z.literal(MSG_VALIDATE_TOKEN),
  token: z.string().optional(),
});
export type ValidateTokenMsg = z.infer<typeof ValidateTokenMsgSchema>;

export const StartGithubOauthMsgSchema = z.object({
  type: z.literal(MSG_START_GITHUB_OAUTH),
  content: z.string().optional(),
});
export type StartGithubOauthMsg = z.infer<typeof StartGithubOauthMsgSchema>;

export const uploadToGistRoute = defineRoute({
  type: MSG_UPLOAD_TO_GIST,
  payloadSchema: UploadToGistMsgSchema,
  responseSchema: SyncActionResponseSchema,
  internalOnly: true,
});

export const deleteGistRoute = defineRoute({
  type: MSG_DELETE_GIST,
  payloadSchema: DeleteGistMsgSchema,
  responseSchema: SyncActionResponseSchema,
  internalOnly: true,
});

export const downloadFromGistRoute = defineRoute({
  type: MSG_DOWNLOAD_FROM_GIST,
  payloadSchema: DownloadFromGistMsgSchema,
  responseSchema: DownloadGistResponseSchema,
  internalOnly: true,
});

export const validateTokenRoute = defineRoute({
  type: MSG_VALIDATE_TOKEN,
  payloadSchema: ValidateTokenMsgSchema,
  responseSchema: ValidateTokenResponseSchema,
  internalOnly: true,
});

export const startGithubOauthRoute = defineRoute({
  type: MSG_START_GITHUB_OAUTH,
  payloadSchema: StartGithubOauthMsgSchema,
  responseSchema: StartGithubOauthResponseSchema,
  internalOnly: true,
});
