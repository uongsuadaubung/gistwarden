import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import {
  findMatchingFido2AccountsWasm,
  findMatchingFido2CredentialsWasm,
  generatePasskeyAssertResponseWasm,
  generatePasskeyRegisterResponseWasm,
  VaultItemType,
} from "@gistwarden/domain";
import type { LoginVaultItem, VaultItem } from "@gistwarden/domain";
import type { Fido2Credential } from "@gistwarden/domain";

import { saveItem } from "@/features/vault/vault-service.ts";
import { accountStore } from "@/core/store.ts";
import {
  rejectFido2RequestRoute,
  resolveFido2RequestRoute,
} from "@gistwarden/orchestrator";
import { sendBackgroundMessage } from "@/core/messaging.ts";

export interface Fido2Request {
  success: boolean;
  type: "create" | "get";
  origin: string;
  options: {
    rpId?: string;
    rp?: {
      id?: string;
      name: string;
    };
    user?: {
      id: string;
      name: string;
      displayName?: string;
    };
    challenge: string;
    userVerification?: "required" | "preferred" | "discouraged";
    allowCredentials?: Array<{
      id: string;
      type: string;
    }>;
  };
}

export interface MatchingPasskey {
  credential: Fido2Credential;
  vaultItemName: string;
  vaultItemId: string;
}

function isLoginVaultItem(item: unknown): item is LoginVaultItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "type" in item &&
    "login" in item
  );
}

function isMatchingPasskey(item: unknown): item is MatchingPasskey {
  return (
    typeof item === "object" &&
    item !== null &&
    "credential" in item &&
    "vaultItemId" in item
  );
}

export function findMatchingFido2Accounts(
  vaultItems: VaultItem[],
  rpId: string,
  origin: string,
): LoginVaultItem[] {
  try {
    const raw = findMatchingFido2AccountsWasm(vaultItems, rpId, origin);
    if (Array.isArray(raw)) return raw.filter(isLoginVaultItem);
  } catch (e) {
    console.error("[FIDO2 WASM] findMatchingFido2Accounts error:", e);
  }
  return [];
}

export function findMatchingFido2Credentials(
  vaultItems: VaultItem[],
  rpId: string,
  allowCredentials?: Array<{ id: string; type: string }>,
): MatchingPasskey[] {
  try {
    const raw = findMatchingFido2CredentialsWasm(
      vaultItems,
      rpId,
      allowCredentials || [],
    );
    if (Array.isArray(raw)) return raw.filter(isMatchingPasskey);
  } catch (e) {
    console.error("[FIDO2 WASM] findMatchingFido2Credentials error:", e);
  }
  return [];
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

  let generateResVal: {
    newCred: Fido2Credential;
    result: Record<string, unknown>;
  };
  try {
    generateResVal = generatePasskeyRegisterResponseWasm<Fido2Credential>(
      {
        ...req.options,
        rp,
        user,
        challenge,
      },
      req.origin,
    );
  } catch (e) {
    console.error("[FIDO2 WASM Register error]:", e);
    return err("fido2_error_create_failed");
  }

  const { newCred, result } = generateResVal;

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
        c.credentialId === option ? newCred : c
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
    saveRes = await saveItem(updatedItem);
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
    saveRes = await saveItem(newItem);
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
  if (!selected) return err("fido2_error_assert_failed");
  const cred = selected.credential;

  let assertResVal: {
    result: Record<string, unknown>;
    nextCounter: number;
    updatedCredential: Fido2Credential;
  };

  try {
    assertResVal = generatePasskeyAssertResponseWasm<Fido2Credential>(
      req.options,
      req.origin,
      cred,
    );
  } catch (e) {
    console.error("[FIDO2 WASM Assert error]:", e);
    return err("fido2_error_assert_failed");
  }

  const { result, updatedCredential } = assertResVal;

  const originalItem = accountStore.vaultItems.find((v) =>
    v.id === selected.vaultItemId
  );
  if (
    !originalItem || originalItem.type !== VaultItemType.Login ||
    !originalItem.login
  ) {
    return err("fido2_error_assert_failed");
  }

  const updatedItem: LoginVaultItem = {
    ...originalItem,
    type: VaultItemType.Login,
    login: {
      ...originalItem.login,
      fido2Credentials: (originalItem.login.fido2Credentials || []).map((
        c: Fido2Credential,
      ) => c.credentialId === cred.credentialId ? updatedCredential : c),
    },
  };

  const saveRes = await saveItem(updatedItem);
  if (saveRes.isErr()) {
    return err("fido2_error_counter_update_failed");
  }

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
