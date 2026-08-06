import { err, ok, Result } from "neverthrow";
import type { Fido2Credential } from "@gistwarden/domain";
import {
  generatePasskeyAssertResponseWasm,
  generatePasskeyRegisterResponseWasm,
} from "@gistwarden/domain";
import type { TranslationKey } from "@/core/i18n.ts";

export const COSE_ALG_ES256 = -7;
export const AAGUID = new TextEncoder().encode("LazyPasskeyGist1");

export interface PasskeyRegisterOptions {
  rp: {
    id?: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    displayName?: string;
  };
  challenge: string;
}

export interface PasskeyAssertOptions {
  challenge: string;
  rpId?: string;
  userVerification?: "required" | "preferred" | "discouraged";
  allowCredentials?: Array<{
    id: string;
    type: string;
  }>;
}

export async function generatePasskeyRegisterResponse(
  options: PasskeyRegisterOptions,
  origin: string,
): Promise<
  Result<
    { newCred: Fido2Credential; result: Record<string, unknown> },
    TranslationKey
  >
> {
  try {
    const res = generatePasskeyRegisterResponseWasm<Fido2Credential>(
      options,
      origin,
    );
    return ok(res);
  } catch {
    return err("fido2_error_create_failed");
  }
}

export async function generatePasskeyAssertResponse(
  options: PasskeyAssertOptions,
  origin: string,
  cred: Fido2Credential,
): Promise<
  Result<
    {
      result: Record<string, unknown>;
      nextCounter: number;
      updatedCredential: Fido2Credential;
    },
    TranslationKey
  >
> {
  try {
    const res = generatePasskeyAssertResponseWasm<Fido2Credential>(
      options,
      origin,
      cred,
    );
    return ok(res);
  } catch {
    return err("fido2_error_assert_failed");
  }
}
