import { z } from "zod";
import { getBaseDomain, getDomainFromItem } from "@/core/domain-utils.ts";
import { isLoginItem, VaultItemType } from "@/features/vault/vault-types.ts";
import { getDecryptedVaultItems } from "@/features/vault/vault-repository.ts";
import { pendingNotificationManager } from "@/extension/pending-notification-manager.ts";
import { openPopup, sendMessageToTab } from "@/core/tabs.ts";
import {
  MSG_SHOW_NOTIFICATION_BAR,
  STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
} from "@/core/constants.ts";
import { getLocalItem, removeLocalItem, setLocalItem } from "@/core/storage.ts";
import { batchSavePayloads } from "@/features/vault/vault-service.ts";
import {
  type CheckAutofillSuggestionResponse,
  type SaveActionPayload,
  SaveActionPayloadSchema,
} from "@/features/vault/vault-schemas.ts";
import { filterMatchingDomainItems } from "@/features/vault/vault-domain-matching.ts";

const SubmittedCredentialsSchema = z.object({
  domain: z.string(),
  url: z.string(),
  username: z.string(),
  password: z.string(),
});

export async function processSubmittedCredentialsUseCase(
  rawCreds: unknown,
  tabId: number,
): Promise<void> {
  const parseRes = SubmittedCredentialsSchema.safeParse(rawCreds);
  if (!parseRes.success) return;
  const creds = parseRes.data;

  const cleanPassword = creds.password.trim();
  if (!cleanPassword) return;

  if (/^\d{6}$/.test(cleanPassword)) return;

  const vaultData = await getDecryptedVaultItems();
  const items = vaultData ? vaultData.items : [];

  const domain = creds.domain || getBaseDomain(creds.url);
  const normalizedUser = creds.username.toLowerCase().trim();

  const domainItems = items.filter((item) => {
    if (!isLoginItem(item)) return false;
    const itemDomain = getDomainFromItem(item);
    if (!itemDomain) return false;
    return getBaseDomain(itemDomain) === domain;
  });

  const matchingUserItem = domainItems.find((item) => {
    if (!isLoginItem(item)) return false;
    return (item.login.username || "").toLowerCase().trim() === normalizedUser;
  });

  let notificationPayload: unknown = null;

  if (matchingUserItem && isLoginItem(matchingUserItem)) {
    if (matchingUserItem.login.password === creds.password) {
      return;
    }
    notificationPayload = {
      actionType: "update",
      domain,
      username: creds.username,
      password: creds.password,
      itemId: matchingUserItem.id,
    };
  } else {
    notificationPayload = {
      actionType: "add",
      domain,
      username: creds.username,
      password: creds.password,
    };
  }

  await pendingNotificationManager.setTabNotification(tabId, {
    payload: notificationPayload,
    timestamp: Date.now(),
  });
  await pendingNotificationManager.setGlobalNotification({
    payload: notificationPayload,
    timestamp: Date.now(),
    domain,
  });

  setTimeout(async () => {
    const currentPending = await pendingNotificationManager.getTabNotification(
      tabId,
    );
    if (currentPending && currentPending.payload === notificationPayload) {
      sendMessageToTab(tabId, {
        type: MSG_SHOW_NOTIFICATION_BAR,
        payload: notificationPayload,
      });
    }
  }, 300);
}

let isProcessingPendingQueue = false;

export async function processPendingUnapprovedCredentialsUseCase(): Promise<
  void
> {
  if (isProcessingPendingQueue) return;
  isProcessingPendingQueue = true;

  const pendingRes = await getLocalItem(
    STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
  );
  if (
    pendingRes.isErr() || !Array.isArray(pendingRes.value) ||
    pendingRes.value.length === 0
  ) {
    isProcessingPendingQueue = false;
    return;
  }
  const pendingItems = pendingRes.value;

  await removeLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS);
  await pendingNotificationManager.clearAll();

  const vaultData = await getDecryptedVaultItems();
  if (!vaultData) {
    isProcessingPendingQueue = false;
    return;
  }

  const validPayloads: SaveActionPayload[] = [];

  for (const rawItem of pendingItems) {
    const parsed = SaveActionPayloadSchema.safeParse(rawItem);
    if (parsed.success) {
      validPayloads.push(parsed.data);
    }
  }

  if (validPayloads.length > 0) {
    await batchSavePayloads(vaultData, validPayloads);
  }

  isProcessingPendingQueue = false;
}

export async function saveCredentialActionUseCase(
  rawPayload: unknown,
): Promise<boolean> {
  const parseRes = SaveActionPayloadSchema.safeParse(rawPayload);
  if (!parseRes.success) return false;
  const payload = parseRes.data;

  const vaultData = await getDecryptedVaultItems();
  if (!vaultData) {
    const rawPendingRes = await getLocalItem(
      STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
    );
    const rawPending = rawPendingRes.isOk() ? rawPendingRes.value : null;
    const pendingList: unknown[] = Array.isArray(rawPending) ? rawPending : [];
    pendingList.push(payload);
    await setLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS, pendingList);

    await openPopup();
    return true;
  }

  const rawPendingRes = await getLocalItem(
    STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
  );
  const rawPending = rawPendingRes.isOk() ? rawPendingRes.value : null;
  await removeLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS);

  const pendingList: unknown[] = Array.isArray(rawPending) ? rawPending : [];
  pendingList.push(payload);

  const validPayloads: SaveActionPayload[] = [];
  for (const rawItem of pendingList) {
    const pRes = SaveActionPayloadSchema.safeParse(rawItem);
    if (pRes.success) {
      validPayloads.push(pRes.data);
    }
  }

  return await batchSavePayloads(vaultData, validPayloads);
}

export async function checkAutofillSuggestionUseCase(
  domainStr?: string,
): Promise<CheckAutofillSuggestionResponse> {
  if (!domainStr) {
    return { success: false, reason: "invalid_domain" };
  }

  const vaultData = await getDecryptedVaultItems();
  if (!vaultData) {
    return { success: false, reason: "locked" };
  }

  const matches = filterMatchingDomainItems(
    vaultData.items,
    domainStr,
    VaultItemType.Login,
  );

  const matchingAccounts = matches
    .filter(isLoginItem)
    .map((m) => ({
      itemId: m.id,
      name: m.name,
      username: m.login.username || "",
      password: m.login.password || "",
      totp: m.login.totp || "",
    }));

  if (matchingAccounts.length === 0) {
    return { success: false, reason: "no_matches" };
  }

  const bestMatch = matchingAccounts[0];

  return {
    success: true,
    payload: {
      actionType: "autofill",
      domain: domainStr,
      username: bestMatch.username,
      password: bestMatch.password,
      totp: bestMatch.totp,
      accounts: matchingAccounts,
    },
  };
}
