import { z } from "zod";
import type { TranslationKey } from "@/core/i18n.ts";

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
