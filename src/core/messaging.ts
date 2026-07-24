import { z } from "zod";
import { err, ok, Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import {
  MSG_CHECK_AUTOFILL_SUGGESTION,
  MSG_CHECK_PENDING_NOTIFICATION,
  MSG_CREDENTIALS_SUBMITTED,
  MSG_DELETE_GIST,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_FIDO2_CREDENTIAL_CREATION_REQUEST,
  MSG_FIDO2_CREDENTIAL_GET_REQUEST,
  MSG_FIDO2_HEARTBEAT,
  MSG_GET_PENDING_FIDO2_REQUEST,
  MSG_REJECT_FIDO2_REQUEST,
  MSG_RESET_TIMEOUT,
  MSG_RESOLVE_FIDO2_REQUEST,
  MSG_SAVE_CREDENTIAL_ACTION,
  MSG_START_GITHUB_OAUTH,
  MSG_UPLOAD_TO_GIST,
  MSG_VALIDATE_TOKEN,
} from "@/core/constants.ts";

// --- Notification Payload Schemas & Types ---
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

// --- Save Action Payload Schemas & Types ---
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

// --- Extension Message Schemas & Types ---
export const CheckAutofillSuggestionMsgSchema = z.object({
  type: z.literal(MSG_CHECK_AUTOFILL_SUGGESTION),
  domain: z.string().optional(),
});

export const CheckPendingNotificationMsgSchema = z.object({
  type: z.literal(MSG_CHECK_PENDING_NOTIFICATION),
  content: z.string().optional(),
});

export const CredentialsSubmittedMsgSchema = z.object({
  type: z.literal(MSG_CREDENTIALS_SUBMITTED),
  credentials: z.unknown().optional(),
});

export const SaveCredentialActionMsgSchema = z.object({
  type: z.literal(MSG_SAVE_CREDENTIAL_ACTION),
  choice: z.string().optional(),
  payload: z.unknown().optional(),
});

export const UploadToGistMsgSchema = z.object({
  type: z.literal(MSG_UPLOAD_TO_GIST),
  content: z.string().optional(),
});

export const DeleteGistMsgSchema = z.object({
  type: z.literal(MSG_DELETE_GIST),
  content: z.string().optional(),
});

export const DownloadFromGistMsgSchema = z.object({
  type: z.literal(MSG_DOWNLOAD_FROM_GIST),
});

export const ValidateTokenMsgSchema = z.object({
  type: z.literal(MSG_VALIDATE_TOKEN),
  token: z.string().optional(),
});

export const StartGithubOauthMsgSchema = z.object({
  type: z.literal(MSG_START_GITHUB_OAUTH),
  content: z.string().optional(),
});

export const Fido2CredentialCreationRequestMsgSchema = z.object({
  type: z.literal(MSG_FIDO2_CREDENTIAL_CREATION_REQUEST),
  data: z.unknown().optional(),
});

export const Fido2CredentialGetRequestMsgSchema = z.object({
  type: z.literal(MSG_FIDO2_CREDENTIAL_GET_REQUEST),
  data: z.unknown().optional(),
});

export const GetPendingFido2RequestMsgSchema = z.object({
  type: z.literal(MSG_GET_PENDING_FIDO2_REQUEST),
});

export const ResolveFido2RequestMsgSchema = z.object({
  type: z.literal(MSG_RESOLVE_FIDO2_REQUEST),
  result: z.unknown().optional(),
});

export const RejectFido2RequestMsgSchema = z.object({
  type: z.literal(MSG_REJECT_FIDO2_REQUEST),
  error: z.string().optional(),
});

export const Fido2HeartbeatMsgSchema = z.object({
  type: z.literal(MSG_FIDO2_HEARTBEAT),
});

export const ResetTimeoutMsgSchema = z.object({
  type: z.literal(MSG_RESET_TIMEOUT),
});

export const ChromeMessageSchema = z.discriminatedUnion("type", [
  CheckAutofillSuggestionMsgSchema,
  CheckPendingNotificationMsgSchema,
  CredentialsSubmittedMsgSchema,
  SaveCredentialActionMsgSchema,
  UploadToGistMsgSchema,
  DeleteGistMsgSchema,
  DownloadFromGistMsgSchema,
  ValidateTokenMsgSchema,
  StartGithubOauthMsgSchema,
  Fido2CredentialCreationRequestMsgSchema,
  Fido2CredentialGetRequestMsgSchema,
  GetPendingFido2RequestMsgSchema,
  ResolveFido2RequestMsgSchema,
  RejectFido2RequestMsgSchema,
  Fido2HeartbeatMsgSchema,
  ResetTimeoutMsgSchema,
]);

export type ChromeMessage = z.infer<typeof ChromeMessageSchema>;

export type ExtensionMessageHandler = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

/**
 * Register a listener for extension runtime messages with safety checks for non-extension environments.
 * Returns an unbind function to remove the listener.
 */
export function onExtensionMessage(
  handler: ExtensionMessageHandler,
): () => void {
  if (
    typeof chrome === "undefined" ||
    !chrome.runtime ||
    !chrome.runtime.onMessage
  ) {
    return () => {};
  }

  chrome.runtime.onMessage.addListener(handler);
  return () => {
    chrome.runtime.onMessage.removeListener(handler);
  };
}

/**
 * Send a message to the background script and wait for a response.
 * Handles API availability checks and wraps chrome.runtime.lastError.
 */
export async function sendMessageToBackground(
  message: unknown,
): Promise<Result<unknown, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("messaging_error_send_failed");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.runtime.sendMessage(message),
    (): TranslationKey => "messaging_error_send_failed",
  );
  if (sendRes.isErr()) return err(sendRes.error);
  return ok(sendRes.value);
}

/**
 * Send a message to the background script in a fire-and-forget manner.
 * Use this for signals that do not require a response (e.g., MSG_RESET_TIMEOUT).
 */
export async function notifyBackground(
  message: unknown,
): Promise<Result<void, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("messaging_error_send_failed");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.runtime.sendMessage(message),
    (): TranslationKey => "messaging_error_send_failed",
  );
  if (sendRes.isErr()) return err(sendRes.error);
  return ok(undefined);
}

/**
 * Broadcast a message from the background script to all other parts of the extension.
 * This is effectively the same API as notifyBackground, but named differently
 * to express the intent of the caller (background broadcasting state changes).
 */
export async function broadcastMessage(
  message: unknown,
): Promise<Result<void, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("messaging_error_send_failed");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.runtime.sendMessage(message),
    (): TranslationKey => "messaging_error_send_failed",
  );
  if (sendRes.isErr()) return err(sendRes.error);
  return ok(undefined);
}
