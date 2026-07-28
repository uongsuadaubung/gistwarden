import { z } from "zod";
import {
  MSG_FIDO2_CREDENTIAL_CREATION_REQUEST,
  MSG_FIDO2_CREDENTIAL_GET_REQUEST,
  MSG_FIDO2_HEARTBEAT,
  MSG_GET_PENDING_FIDO2_REQUEST,
  MSG_REJECT_FIDO2_REQUEST,
  MSG_RESOLVE_FIDO2_REQUEST,
} from "./constants.ts";

export const Fido2CredentialSchema = z.object({
  credentialId: z.string(),
  keyType: z.string(),
  keyAlgorithm: z.string(),
  keyCurve: z.string(),
  keyValue: z.string(),
  rpId: z.string(),
  userHandle: z.unknown().optional().transform((v) => {
    if (!v) return undefined;
    if (typeof v === "string") return v;
    if (v instanceof Uint8Array || v instanceof ArrayBuffer) {
      const bytes = new Uint8Array(v);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(
        /=/g,
        "",
      );
    }
    return String(v);
  }).optional(),
  userName: z.string().or(z.null()).optional().transform((v) => v || undefined)
    .optional(),
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
  error: z.string().optional(),
});
export type GetPendingFido2RequestResponse = z.infer<
  typeof GetPendingFido2RequestResponseSchema
>;

export const GetPendingFido2ResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    type: z.enum(["create", "get"]),
    options: z.unknown(),
    origin: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);
export type GetPendingFido2Response = z.infer<
  typeof GetPendingFido2ResponseSchema
>;

export const Fido2ActionResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);
export type Fido2ActionResponse = z.infer<typeof Fido2ActionResponseSchema>;

export const Fido2PromptResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    result: z.unknown().optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);
export type Fido2PromptResponse = z.infer<typeof Fido2PromptResponseSchema>;

export const Fido2CredentialCreationRequestMsgSchema = z.object({
  type: z.literal(MSG_FIDO2_CREDENTIAL_CREATION_REQUEST),
  data: z.unknown().optional(),
});
export type Fido2CredentialCreationRequestMsg = z.infer<
  typeof Fido2CredentialCreationRequestMsgSchema
>;

export const Fido2CredentialGetRequestMsgSchema = z.object({
  type: z.literal(MSG_FIDO2_CREDENTIAL_GET_REQUEST),
  data: z.unknown().optional(),
});
export type Fido2CredentialGetRequestMsg = z.infer<
  typeof Fido2CredentialGetRequestMsgSchema
>;

export const GetPendingFido2RequestMsgSchema = z.object({
  type: z.literal(MSG_GET_PENDING_FIDO2_REQUEST),
});
export type GetPendingFido2RequestMsg = z.infer<
  typeof GetPendingFido2RequestMsgSchema
>;

export const ResolveFido2RequestMsgSchema = z.object({
  type: z.literal(MSG_RESOLVE_FIDO2_REQUEST),
  result: z.unknown().optional(),
});
export type ResolveFido2RequestMsg = z.infer<
  typeof ResolveFido2RequestMsgSchema
>;

export const RejectFido2RequestMsgSchema = z.object({
  type: z.literal(MSG_REJECT_FIDO2_REQUEST),
  error: z.string().optional(),
});
export type RejectFido2RequestMsg = z.infer<
  typeof RejectFido2RequestMsgSchema
>;

export const Fido2HeartbeatMsgSchema = z.object({
  type: z.literal(MSG_FIDO2_HEARTBEAT),
});
export type Fido2HeartbeatMsg = z.infer<typeof Fido2HeartbeatMsgSchema>;
