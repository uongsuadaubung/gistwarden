import {
  type Fido2Credential,
  type LoginVaultItem,
  type VaultItem,
  VaultItemType,
} from "./types.ts";
import { saveItem } from "./vault-service.ts";
import {
  generatePasskeyAssertResponse,
  generatePasskeyRegisterResponse,
} from "./passkey-crypto.ts";
import {
  MSG_REJECT_FIDO2_REQUEST,
  MSG_RESOLVE_FIDO2_REQUEST,
} from "./constants.ts";
import { getBaseDomain } from "./domain-utils.ts";
import { store } from "./store.ts";

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

const getDomainFromUrl = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    return url.hostname.toLowerCase();
  } catch (_e) {
    return urlStr.toLowerCase();
  }
};

const isDomainMatch = (domainA: string, domainB: string): boolean => {
  const baseA = getBaseDomain(domainA);
  const baseB = getBaseDomain(domainB);
  return !!baseA && baseA === baseB;
};

export function findMatchingFido2Accounts(
  vaultItems: VaultItem[],
  rpId: string,
  origin: string,
): LoginVaultItem[] {
  const rpIdNormalized = rpId.toLowerCase().trim();
  const originHost = getDomainFromUrl(origin);

  return vaultItems.filter((item): item is LoginVaultItem => {
    if (item.type !== VaultItemType.Login || !item.login) return false;

    if (item.login.uris) {
      const hasMatchingUri = item.login.uris.some((u) => {
        const uriHost = getDomainFromUrl(u.uri);
        return isDomainMatch(uriHost, rpIdNormalized) ||
          isDomainMatch(uriHost, originHost);
      });
      if (hasMatchingUri) return true;
    }

    const itemName = item.name.toLowerCase().trim();
    if (
      itemName === rpIdNormalized ||
      itemName === originHost ||
      isDomainMatch(itemName, rpIdNormalized)
    ) {
      return true;
    }

    return false;
  });
}

export function findMatchingFido2Credentials(
  vaultItems: VaultItem[],
  rpId: string,
): MatchingPasskey[] {
  const list: MatchingPasskey[] = [];
  vaultItems.forEach((item) => {
    if (item.type !== VaultItemType.Login) return;
    if (item.login.fido2Credentials) {
      item.login.fido2Credentials.forEach((cred: Fido2Credential) => {
        if (cred.rpId?.trim().toLowerCase() === rpId?.trim().toLowerCase()) {
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
): Promise<{ success: boolean; error?: string }> {
  const rp = req.options.rp;
  const user = req.options.user;
  const challenge = req.options.challenge;
  if (!rp || !user || !challenge) {
    return {
      success: false,
      error: "Missing required registration parameters (rp, user, challenge)",
    };
  }

  try {
    const { newCred, result } = await generatePasskeyRegisterResponse(
      {
        ...req.options,
        rp,
        user,
        challenge,
      },
      req.origin,
    );

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

    if (!saveRes.success) {
      return {
        success: false,
        error: saveRes.error || "fido2_error_save_failed",
      };
    }

    await chrome.runtime.sendMessage({
      type: MSG_RESOLVE_FIDO2_REQUEST,
      result,
    });
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "fido2_error_create_failed" };
  }
}

export async function assertFido2Passkey(
  req: Fido2Request,
  matchingCredentials: MatchingPasskey[],
  selectedCredIndex: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const selected = matchingCredentials[selectedCredIndex];
    const cred = selected.credential;

    const nextCounter = Math.max(cred.counter + 1, 100000);

    const updatedCred: Fido2Credential = {
      ...cred,
      counter: nextCounter,
    };

    const originalItem = store.vaultItems.find((v) =>
      v.id === selected.vaultItemId
    );
    if (
      !originalItem || originalItem.type !== VaultItemType.Login ||
      !originalItem.login
    ) {
      throw new Error("Vault item not found");
    }

    const updatedItem: LoginVaultItem = {
      ...originalItem,
      type: VaultItemType.Login,
      login: {
        ...originalItem.login,
        fido2Credentials: (originalItem.login.fido2Credentials || []).map((
          c: Fido2Credential,
        ) => c.credentialId === cred.credentialId ? updatedCred : c),
      },
    };

    const saveRes = await saveItem(updatedItem);
    if (!saveRes.success) {
      throw new Error(
        saveRes.error || "fido2_error_counter_update_failed",
      );
    }

    const { result } = await generatePasskeyAssertResponse(
      req.options,
      req.origin,
      cred,
      nextCounter,
    );

    await chrome.runtime.sendMessage({
      type: MSG_RESOLVE_FIDO2_REQUEST,
      result,
    });
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "fido2_error_assert_failed" };
  }
}

export async function rejectFido2Request() {
  try {
    await chrome.runtime.sendMessage({
      type: MSG_REJECT_FIDO2_REQUEST,
      error: "NotAllowedError: User cancelled the request",
    });
  } catch (_e) {
    // Ignore
  }
}
