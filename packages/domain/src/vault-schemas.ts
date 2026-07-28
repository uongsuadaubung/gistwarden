import { z } from "zod";
import {
  MSG_CHECK_AUTOFILL_SUGGESTION,
  MSG_CHECK_PENDING_NOTIFICATION,
  MSG_CREDENTIALS_SUBMITTED,
  MSG_SAVE_CREDENTIAL_ACTION,
  MSG_USER_ACTIVITY,
} from "./constants.ts";
import { CustomFieldType, VaultItemType } from "./vault-types.ts";
import { Fido2CredentialSchema } from "./fido2-schemas.ts";
import { createSuccessPayloadResponseSchema } from "./types.ts";

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

const BaseVaultItemUnionSchema = z.discriminatedUnion("type", [
  LoginVaultItemSchema,
  SecureNoteVaultItemSchema,
  CardVaultItemSchema,
  IdentityVaultItemSchema,
  SshKeyVaultItemSchema,
]);

function isObjectRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

export const VaultItemSchema = z.preprocess((val) => {
  if (isObjectRecord(val) && "type" in val) {
    const numType = Number(val.type);
    if (!Number.isNaN(numType)) {
      return { ...val, type: numType };
    }
  }
  return val;
}, BaseVaultItemUnionSchema);

export type VaultItem = z.infer<typeof BaseVaultItemUnionSchema>;

export const VaultListSchema = z.array(VaultItemSchema);
export type VaultList = z.infer<typeof VaultListSchema>;

export const TrashVaultItemSchema = z.object({
  item: VaultItemSchema,
  deletedDate: z.string(),
});
export type TrashVaultItem = z.infer<typeof TrashVaultItemSchema>;

export const VaultPayloadSchema = z.object({
  items: z.array(VaultItemSchema).default([]),
  trash: z.array(TrashVaultItemSchema).optional().default([]),
});
export type VaultPayload = z.infer<typeof VaultPayloadSchema>;

// --- Notification & Autofill Messaging Schemas ---
export const AddCredentialPayloadSchema = z.object({
  actionType: z.literal("add"),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  onDismiss: z.custom<() => void>().optional(),
});
export type AddCredentialPayload = z.infer<typeof AddCredentialPayloadSchema>;

export const UpdateCredentialPayloadSchema = z.object({
  actionType: z.literal("update"),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  itemId: z.string(),
  onDismiss: z.custom<() => void>().optional(),
});
export type UpdateCredentialPayload = z.infer<
  typeof UpdateCredentialPayloadSchema
>;

export type SaveCredentialPayload =
  | AddCredentialPayload
  | UpdateCredentialPayload;

export const AccountItemSchema = z.object({
  itemId: z.string(),
  name: z.string().optional(),
  username: z.string(),
  password: z.string().optional(),
  totp: z.string().optional(),
});
export type AutofillMatchingAccount = z.infer<typeof AccountItemSchema>;

export const AutofillSuggestionPayloadSchema = z.object({
  actionType: z.literal("autofill"),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  itemId: z.string().optional(),
  totp: z.string().optional(),
  accounts: z.array(AccountItemSchema).optional(),
  onFill: z.custom<(selectedAcc?: AutofillMatchingAccount) => void>()
    .optional(),
  onDismiss: z.custom<() => void>().optional(),
});
export type AutofillSuggestionPayload = z.infer<
  typeof AutofillSuggestionPayloadSchema
>;

export const NotificationPayloadSchema = z.discriminatedUnion("actionType", [
  AddCredentialPayloadSchema,
  UpdateCredentialPayloadSchema,
  AutofillSuggestionPayloadSchema,
]);
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

export const AddActionPayloadSchema = z.object({
  actionType: z.literal("add"),
  domain: z.string(),
  username: z.string(),
  password: z.string(),
});
export const UpdateActionPayloadSchema = z.object({
  actionType: z.literal("update"),
  domain: z.string(),
  username: z.string(),
  password: z.string(),
  itemId: z.string(),
});
export const SaveActionPayloadSchema = z.discriminatedUnion("actionType", [
  AddActionPayloadSchema,
  UpdateActionPayloadSchema,
]);
export type SaveActionPayload = z.infer<typeof SaveActionPayloadSchema>;

export const CheckAutofillSuggestionMsgSchema = z.object({
  type: z.literal(MSG_CHECK_AUTOFILL_SUGGESTION),
  domain: z.string().optional(),
});
export type CheckAutofillSuggestionMsg = z.infer<
  typeof CheckAutofillSuggestionMsgSchema
>;

export const CheckAutofillSuggestionResponseSchema = z.discriminatedUnion(
  "success",
  [
    z.object({
      success: z.literal(true),
      payload: AutofillSuggestionPayloadSchema,
    }),
    z.object({
      success: z.literal(false),
      reason: z.enum(["invalid_domain", "locked", "no_matches"]),
    }),
  ],
);
export type CheckAutofillSuggestionResponse = z.infer<
  typeof CheckAutofillSuggestionResponseSchema
>;

export const CheckPendingNotificationMsgSchema = z.object({
  type: z.literal(MSG_CHECK_PENDING_NOTIFICATION),
  content: z.string().optional(),
});
export type CheckPendingNotificationMsg = z.infer<
  typeof CheckPendingNotificationMsgSchema
>;

export const CheckPendingNotificationResponseSchema =
  createSuccessPayloadResponseSchema(z.unknown());
export type CheckPendingNotificationResponse = z.infer<
  typeof CheckPendingNotificationResponseSchema
>;

export const CredentialsSubmittedMsgSchema = z.object({
  type: z.literal(MSG_CREDENTIALS_SUBMITTED),
  credentials: z.unknown().optional(),
});
export type CredentialsSubmittedMsg = z.infer<
  typeof CredentialsSubmittedMsgSchema
>;

export const SaveCredentialActionMsgSchema = z.object({
  type: z.literal(MSG_SAVE_CREDENTIAL_ACTION),
  choice: z.string().optional(),
  payload: z.unknown().optional(),
});
export type SaveCredentialActionMsg = z.infer<
  typeof SaveCredentialActionMsgSchema
>;

export const SaveCredentialActionResponseSchema = z.object({
  success: z.boolean(),
});
export type SaveCredentialActionResponse = z.infer<
  typeof SaveCredentialActionResponseSchema
>;

export const UserActivityMsgSchema = z.object({
  type: z.literal(MSG_USER_ACTIVITY),
});
export type UserActivityMsg = z.infer<typeof UserActivityMsgSchema>;
