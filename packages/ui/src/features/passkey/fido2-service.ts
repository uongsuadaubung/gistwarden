import {
  type Fido2Credential,
  Fido2CredentialSchema,
  isMatchingDomain,
  isValidRpIdForOrigin,
  type LoginVaultItem,
  type RpId,
  RpIdSchema,
  type VaultItem,
  VaultItemIdSchema,
  VaultItemType,
} from "@gistwarden/domain";
import {
  rejectFido2RequestRoute,
  resolveFido2RequestRoute,
} from "@gistwarden/orchestrator";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { getBaseDomain } from "@/core/domain-utils.ts";
import type { TranslationKey } from "@/core/i18n.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";
import { accountStore } from "@/core/store.ts";
import {
  generatePasskeyAssertResponse,
  generatePasskeyRegisterResponse,
} from "@/features/passkey/passkey-crypto.ts";
import { createItem, updateItem } from "@/features/vault/vault-service.ts";

export const Fido2RequestSchema = z
  .object({
    success: z.boolean(),
    type: z.enum(["create", "get"]),
    origin: z.string(),
    options: z.object({
      rpId: RpIdSchema.optional(),
      rp: z
        .object({
          id: RpIdSchema.optional(),
          name: z.string().max(200),
        })
        .optional(),
      user: z
        .object({
          id: z.string().max(2048),
          name: z.string().max(320),
          displayName: z.string().max(320).optional(),
        })
        .optional(),
      challenge: z.string(),
      userVerification: z
        .enum(["required", "preferred", "discouraged"])
        .optional(),
      allowCredentials: z
        .array(
          z.object({
            id: z.string(),
            type: z.string(),
          }),
        )
        .optional(),
    }),
  })
  .readonly();
export type Fido2Request = z.infer<typeof Fido2RequestSchema>;

export const MatchingPasskeySchema = z
  .object({
    credential: Fido2CredentialSchema,
    vaultItemName: z.string(),
    vaultItemId: VaultItemIdSchema,
  })
  .readonly();
export type MatchingPasskey = z.infer<typeof MatchingPasskeySchema>;

export function findMatchingFido2Accounts(
  vaultItems: VaultItem[],
  rpId: RpId,
  origin: string,
): LoginVaultItem[] {
  // Security: rpId must be a valid domain suffix for origin (W3C WebAuthn Section 5.1.4)
  if (rpId && origin && !isValidRpIdForOrigin(rpId, origin)) {
    console.warn(
      `[FIDO2 Security] rpId '${rpId}' is not valid for origin '${origin}'`,
    );
    return [];
  }

  const rpIdNormalized = rpId.toLowerCase().trim();

  return vaultItems.filter((item): item is LoginVaultItem => {
    if (item.type !== VaultItemType.Login || !item.login) return false;
    return (
      isMatchingDomain(item, rpIdNormalized) || isMatchingDomain(item, origin)
    );
  });
}

export function findMatchingFido2Credentials(
  vaultItems: VaultItem[],
  rpId: RpId,
  origin?: string,
): MatchingPasskey[] {
  // Security: rpId must be a valid domain suffix for origin (W3C WebAuthn Section 5.1.4)
  if (rpId && origin && !isValidRpIdForOrigin(rpId, origin)) {
    console.warn(
      `[FIDO2 Security] rpId '${rpId}' is not valid for origin '${origin}'`,
    );
    return [];
  }

  const list: MatchingPasskey[] = [];
  const targetRpId = rpId?.trim().toLowerCase() || "";
  const targetBase = getBaseDomain(rpId);

  vaultItems.forEach((item) => {
    if (item.type !== VaultItemType.Login) return;
    if (item.login.fido2Credentials) {
      item.login.fido2Credentials.forEach((cred: Fido2Credential) => {
        const credRpId = cred.rpId?.trim().toLowerCase() || "";
        const credBase = getBaseDomain(cred.rpId || "");
        const isMatch =
          credRpId === targetRpId ||
          (Boolean(credBase) && credBase === targetBase);

        if (isMatch) {
          list.push({
            vaultItemId: item.id,
            vaultItemName: item.name,
            credential: cred,
          });
        }
      });
    }
  });
  return list;
}

export async function registerFido2Passkey(
  req: Fido2Request,
  selectedAccountIndex: number | null,
  matchingAccounts: LoginVaultItem[],
  selectedPasskeyOption: string,
): Promise<Result<void, TranslationKey>> {
  const rp = req.options.rp;
  const user = req.options.user;
  const challenge = req.options.challenge;
  if (!rp || !user || !challenge) {
    return err("fido2_error_create_failed");
  }

  const generateRes = await generatePasskeyRegisterResponse(
    {
      ...req.options,
      rp,
      user,
      challenge,
    },
    req.origin,
  );

  if (generateRes.isErr()) {
    return err(generateRes.error);
  }

  const { newCred, result } = generateRes.value;

  let saveRes;
  const idx = selectedAccountIndex;
  if (idx !== null && matchingAccounts[idx]) {
    const existingItem = matchingAccounts[idx];
    let updatedCredentials: Fido2Credential[] = [];
    const existingCredentials = existingItem.login.fido2Credentials || [];
    const option = selectedPasskeyOption;

    if (option === "add") {
      updatedCredentials = [...existingCredentials, newCred];
    } else {
      updatedCredentials = existingCredentials.map((c) =>
        c.credentialId === option ? newCred : c,
      );
      if (!existingCredentials.some((c) => c.credentialId === option)) {
        updatedCredentials.push(newCred);
      }
    }

    const updatedItem: Partial<LoginVaultItem> = {
      id: existingItem.id,
      type: VaultItemType.Login,
      login: {
        ...existingItem.login,
        fido2Credentials: updatedCredentials,
      },
    };
    saveRes = await updateItem(existingItem.id, updatedItem);
  } else {
    const newItem: Partial<VaultItem> = {
      name: rp.name || rp.id || "",
      type: VaultItemType.Login,
      login: {
        username: user.name,
        password: "",
        uris: [{ uri: req.origin }],
        fido2Credentials: [newCred],
      },
    };
    saveRes = await createItem(newItem);
  }

  if (saveRes.isErr()) {
    console.error("[FIDO2 Register] Save item error:", saveRes.error);
    return err(saveRes.error);
  }

  await sendBackgroundMessage(resolveFido2RequestRoute, {
    result,
  });

  return ok();
}

export async function assertFido2Passkey(
  req: Fido2Request,
  matchingCredentials: MatchingPasskey[],
  selectedCredIndex: number,
): Promise<Result<void, TranslationKey>> {
  const selected = matchingCredentials[selectedCredIndex];
  if (!selected) {
    return err("fido2_error_assert_failed");
  }
  const cred = selected.credential;

  const nextCounter = Math.max(cred.counter + 1, 100000);

  const updatedCred: Fido2Credential = {
    ...cred,
    counter: nextCounter,
  };

  const originalItem = accountStore.vaultItems.find(
    (v) => v.id === selected.vaultItemId,
  );
  if (
    !originalItem ||
    originalItem.type !== VaultItemType.Login ||
    !originalItem.login
  ) {
    return err("fido2_error_assert_failed");
  }

  const updatedItem: LoginVaultItem = {
    ...originalItem,
    type: VaultItemType.Login,
    login: {
      ...originalItem.login,
      fido2Credentials: (originalItem.login.fido2Credentials || []).map(
        (c: Fido2Credential) =>
          c.credentialId === cred.credentialId ? updatedCred : c,
      ),
    },
  };

  const saveRes = await updateItem(originalItem.id, updatedItem);
  if (saveRes.isErr()) {
    return err(saveRes.error);
  }

  const assertRes = await generatePasskeyAssertResponse(
    req.options,
    req.origin,
    cred,
    nextCounter,
  );

  if (assertRes.isErr()) {
    return err(assertRes.error);
  }

  const { result } = assertRes.value;

  await sendBackgroundMessage(resolveFido2RequestRoute, {
    result,
  });

  return ok();
}

export async function rejectFido2Request(): Promise<void> {
  await sendBackgroundMessage(rejectFido2RequestRoute, {
    error: "NotAllowedError: User cancelled the request",
  });
}
