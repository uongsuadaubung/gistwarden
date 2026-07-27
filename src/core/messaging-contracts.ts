import { z } from "zod";
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
  MSG_RESOLVE_FIDO2_REQUEST,
  MSG_SAVE_CREDENTIAL_ACTION,
  MSG_START_GITHUB_OAUTH,
  MSG_UPLOAD_TO_GIST,
  MSG_USER_ACTIVITY,
  MSG_VALIDATE_TOKEN,
} from "@/core/constants.ts";
import {
  type DeleteGistMsg,
  DeleteGistMsgSchema,
  type DownloadFromGistMsg,
  DownloadFromGistMsgSchema,
  type DownloadGistResponse,
  DownloadGistResponseSchema,
  type SimpleSuccessResponse,
  SimpleSuccessResponseSchema,
  type StartGithubOauthMsg,
  StartGithubOauthMsgSchema,
  type StartGithubOauthResponse,
  StartGithubOauthResponseSchema,
  type SyncActionResponse,
  SyncActionResponseSchema,
  type UploadToGistMsg,
  UploadToGistMsgSchema,
  type ValidateTokenMsg,
  ValidateTokenMsgSchema,
  type ValidateTokenResponse,
  ValidateTokenResponseSchema,
} from "@/features/sync/sync-schemas.ts";
import {
  type Fido2ActionResponse,
  Fido2ActionResponseSchema,
  type Fido2CredentialCreationRequestMsg,
  Fido2CredentialCreationRequestMsgSchema,
  type Fido2CredentialGetRequestMsg,
  Fido2CredentialGetRequestMsgSchema,
  type Fido2HeartbeatMsg,
  Fido2HeartbeatMsgSchema,
  type Fido2PromptResponse,
  Fido2PromptResponseSchema,
  type GetPendingFido2RequestMsg,
  GetPendingFido2RequestMsgSchema,
  type GetPendingFido2RequestResponse,
  GetPendingFido2RequestResponseSchema,
  type RejectFido2RequestMsg,
  RejectFido2RequestMsgSchema,
  type ResolveFido2RequestMsg,
  ResolveFido2RequestMsgSchema,
} from "@/features/passkey/fido2-schemas.ts";
import {
  type CheckAutofillSuggestionMsg,
  CheckAutofillSuggestionMsgSchema,
  type CheckAutofillSuggestionResponse,
  CheckAutofillSuggestionResponseSchema,
  type CheckPendingNotificationMsg,
  CheckPendingNotificationMsgSchema,
  type CheckPendingNotificationResponse,
  CheckPendingNotificationResponseSchema,
  type CredentialsSubmittedMsg,
  CredentialsSubmittedMsgSchema,
  type SaveCredentialActionMsg,
  SaveCredentialActionMsgSchema,
  type SaveCredentialActionResponse,
  SaveCredentialActionResponseSchema,
  type UserActivityMsg,
  UserActivityMsgSchema,
} from "@/features/vault/vault-schemas.ts";

export type MessageContract<TPayload, TResponse> = {
  payloadSchema: z.ZodType<TPayload>;
  responseSchema: z.ZodType<TResponse>;
};

export type ContractMap = {
  [MSG_START_GITHUB_OAUTH]: MessageContract<
    StartGithubOauthMsg,
    StartGithubOauthResponse
  >;
  [MSG_GET_PENDING_FIDO2_REQUEST]: MessageContract<
    GetPendingFido2RequestMsg,
    GetPendingFido2RequestResponse
  >;
  [MSG_RESOLVE_FIDO2_REQUEST]: MessageContract<
    ResolveFido2RequestMsg,
    Fido2ActionResponse
  >;
  [MSG_REJECT_FIDO2_REQUEST]: MessageContract<
    RejectFido2RequestMsg,
    Fido2ActionResponse
  >;
  [MSG_UPLOAD_TO_GIST]: MessageContract<UploadToGistMsg, SyncActionResponse>;
  [MSG_DELETE_GIST]: MessageContract<DeleteGistMsg, SyncActionResponse>;
  [MSG_DOWNLOAD_FROM_GIST]: MessageContract<
    DownloadFromGistMsg,
    DownloadGistResponse
  >;
  [MSG_USER_ACTIVITY]: MessageContract<
    UserActivityMsg,
    SimpleSuccessResponse
  >;
  [MSG_VALIDATE_TOKEN]: MessageContract<
    ValidateTokenMsg,
    ValidateTokenResponse
  >;
  [MSG_FIDO2_CREDENTIAL_CREATION_REQUEST]: MessageContract<
    Fido2CredentialCreationRequestMsg,
    Fido2PromptResponse
  >;
  [MSG_FIDO2_CREDENTIAL_GET_REQUEST]: MessageContract<
    Fido2CredentialGetRequestMsg,
    Fido2PromptResponse
  >;
  [MSG_FIDO2_HEARTBEAT]: MessageContract<
    Fido2HeartbeatMsg,
    SimpleSuccessResponse
  >;
  [MSG_CREDENTIALS_SUBMITTED]: MessageContract<
    CredentialsSubmittedMsg,
    SimpleSuccessResponse
  >;
  [MSG_SAVE_CREDENTIAL_ACTION]: MessageContract<
    SaveCredentialActionMsg,
    SaveCredentialActionResponse
  >;
  [MSG_CHECK_PENDING_NOTIFICATION]: MessageContract<
    CheckPendingNotificationMsg,
    CheckPendingNotificationResponse
  >;
  [MSG_CHECK_AUTOFILL_SUGGESTION]: MessageContract<
    CheckAutofillSuggestionMsg,
    CheckAutofillSuggestionResponse
  >;
};

export const MESSAGE_CONTRACTS: ContractMap = {
  [MSG_START_GITHUB_OAUTH]: {
    payloadSchema: StartGithubOauthMsgSchema,
    responseSchema: StartGithubOauthResponseSchema,
  },
  [MSG_GET_PENDING_FIDO2_REQUEST]: {
    payloadSchema: GetPendingFido2RequestMsgSchema,
    responseSchema: GetPendingFido2RequestResponseSchema,
  },
  [MSG_RESOLVE_FIDO2_REQUEST]: {
    payloadSchema: ResolveFido2RequestMsgSchema,
    responseSchema: Fido2ActionResponseSchema,
  },
  [MSG_REJECT_FIDO2_REQUEST]: {
    payloadSchema: RejectFido2RequestMsgSchema,
    responseSchema: Fido2ActionResponseSchema,
  },
  [MSG_UPLOAD_TO_GIST]: {
    payloadSchema: UploadToGistMsgSchema,
    responseSchema: SyncActionResponseSchema,
  },
  [MSG_DELETE_GIST]: {
    payloadSchema: DeleteGistMsgSchema,
    responseSchema: SyncActionResponseSchema,
  },
  [MSG_DOWNLOAD_FROM_GIST]: {
    payloadSchema: DownloadFromGistMsgSchema,
    responseSchema: DownloadGistResponseSchema,
  },
  [MSG_USER_ACTIVITY]: {
    payloadSchema: UserActivityMsgSchema,
    responseSchema: SimpleSuccessResponseSchema,
  },
  [MSG_VALIDATE_TOKEN]: {
    payloadSchema: ValidateTokenMsgSchema,
    responseSchema: ValidateTokenResponseSchema,
  },
  [MSG_FIDO2_CREDENTIAL_CREATION_REQUEST]: {
    payloadSchema: Fido2CredentialCreationRequestMsgSchema,
    responseSchema: Fido2PromptResponseSchema,
  },
  [MSG_FIDO2_CREDENTIAL_GET_REQUEST]: {
    payloadSchema: Fido2CredentialGetRequestMsgSchema,
    responseSchema: Fido2PromptResponseSchema,
  },
  [MSG_FIDO2_HEARTBEAT]: {
    payloadSchema: Fido2HeartbeatMsgSchema,
    responseSchema: SimpleSuccessResponseSchema,
  },
  [MSG_CREDENTIALS_SUBMITTED]: {
    payloadSchema: CredentialsSubmittedMsgSchema,
    responseSchema: SimpleSuccessResponseSchema,
  },
  [MSG_SAVE_CREDENTIAL_ACTION]: {
    payloadSchema: SaveCredentialActionMsgSchema,
    responseSchema: SaveCredentialActionResponseSchema,
  },
  [MSG_CHECK_PENDING_NOTIFICATION]: {
    payloadSchema: CheckPendingNotificationMsgSchema,
    responseSchema: CheckPendingNotificationResponseSchema,
  },
  [MSG_CHECK_AUTOFILL_SUGGESTION]: {
    payloadSchema: CheckAutofillSuggestionMsgSchema,
    responseSchema: CheckAutofillSuggestionResponseSchema,
  },
};

export type SupportedMessageType = keyof ContractMap;

export type InferPayload<K extends SupportedMessageType> = Omit<
  ContractMap[K] extends MessageContract<infer P, unknown> ? P : never,
  "type"
>;

export type InferResponse<K extends SupportedMessageType> =
  ContractMap[K] extends MessageContract<unknown, infer R> ? R : never;

export function isValidResponse<K extends SupportedMessageType>(
  type: K,
  val: unknown,
): val is InferResponse<K> {
  const contract = MESSAGE_CONTRACTS[type];
  return contract.responseSchema.safeParse(val).success;
}
