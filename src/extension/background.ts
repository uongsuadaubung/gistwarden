import { z } from "zod";
import {
  deleteGist,
  downloadFromGist,
  uploadToGist,
  validateToken,
} from "@/features/sync/github-api.ts";
import { broadcastMessage } from "@/core/messaging.ts";
import {
  ALARM_NAME_VAULT_TIMEOUT,
  FIDO2_PROMPT_HEIGHT,
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
  MSG_SHOW_NOTIFICATION_BAR,
  MSG_START_GITHUB_OAUTH,
  MSG_UPLOAD_TO_GIST,
  MSG_VALIDATE_TOKEN,
  MSG_VAULT_LOCKED,
  MSG_VAULT_LOGGED_OUT,
  POPUP_WIDTH,
  SESSION_KEY_DERIVED_KEY,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_GITHUB_TOKEN,
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  SESSION_KEY_PENDING_FIDO2_REQUEST,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
  SESSION_KEY_SESSION_INITIALIZED,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
} from "@/core/constants.ts";
import {
  clearAlarm,
  clearLocal,
  clearSession,
  createAlarm,
  getAllSettings,
  getLocalItem,
  getSessionItem,
  hasAlarms,
  hasSessionStorage,
  hasStorageOnChanged,
  removeLocalItem,
  removeSessionItem,
  setLocalItem,
  setSessionItem,
  SettingsSchema,
  STORAGE_KEY,
} from "@/core/storage.ts";
import { openPopup, sendMessageToTab } from "@/core/tabs.ts";
import {
  getBaseDomain,
  getDomainFromItem,
  safeParseUrl,
} from "@/core/domain-utils.ts";
import { filterMatchingDomainItems } from "@/features/vault/vault-domain-matching.ts";
import { decryptData, encryptData, getSessionKey } from "@/core/crypto.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import {
  isLoginItem,
  type LoginVaultItem,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
} from "@/core/types.ts";

const PendingFido2RequestSchema = z.object({
  type: z.enum(["create", "get"]),
  options: z.unknown(),
  origin: z.string(),
  senderTabId: z.number(),
});

const EncryptedPayloadSchema = z.object({
  ciphertext: z.string().optional(),
  iv: z.string().optional(),
  salt: z.string().optional(),
});

const SubmittedCredentialsSchema = z.object({
  domain: z.string(),
  url: z.string(),
  username: z.string(),
  password: z.string(),
});

const SaveActionPayloadSchema = z.object({
  actionType: z.enum(["add", "update"]),
  domain: z.string(),
  username: z.string(),
  password: z.string(),
  itemId: z.string().optional(),
});

type SaveActionPayload = z.infer<typeof SaveActionPayloadSchema>;

interface ChromeMessage {
  type: string;
  content?: string;
  token?: string;
  result?: unknown;
  error?: string;
  data?: unknown;
  credentials?: unknown;
  choice?: string;
  payload?: unknown;
  domain?: string;
}

let pendingFido2Callback: ((response: unknown) => void) | null = null;
const pendingTabNotifications = new Map<
  number,
  { payload: unknown; timestamp: number }
>();
let lastGlobalPendingNotification: {
  payload: unknown;
  timestamp: number;
  domain: string;
} | null = null;

async function getDecryptedVaultItems(): Promise<
  {
    items: VaultItem[];
    key: CryptoKey;
    salt: string;
  } | null
> {
  const key = await getSessionKey();
  if (!key) return null;

  const rawVaultRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const rawVault = rawVaultRes.isOk() ? rawVaultRes.value : null;
  if (typeof rawVault !== "string" || !rawVault) {
    return { items: [], key, salt: "" };
  }

  const parsePayloadRes = safeJsonParse(rawVault);
  if (parsePayloadRes.isErr()) return { items: [], key, salt: "" };

  const payloadParse = EncryptedPayloadSchema.safeParse(parsePayloadRes.value);
  if (
    !payloadParse.success || !payloadParse.data.ciphertext ||
    !payloadParse.data.iv
  ) {
    return { items: [], key, salt: "" };
  }

  const { ciphertext, iv, salt } = payloadParse.data;
  const decryptRes = await decryptData(ciphertext, iv, key);
  if (decryptRes.isErr()) return { items: [], key, salt: salt || "" };

  const parseItemsRes = safeJsonParse(decryptRes.value);
  if (parseItemsRes.isErr()) return { items: [], key, salt: salt || "" };

  const validateRes = VaultListSchema.safeParse(parseItemsRes.value);
  if (!validateRes.success) return { items: [], key, salt: salt || "" };

  return { items: validateRes.data, key, salt: salt || "" };
}

async function handleSubmittedCredentials(
  rawCreds: unknown,
  tabId: number,
): Promise<void> {
  const parseRes = SubmittedCredentialsSchema.safeParse(rawCreds);
  if (!parseRes.success) return;
  const creds = parseRes.data;

  const cleanPassword = creds.password.trim();
  if (!cleanPassword) return;

  // Ignore 6-digit numeric passwords as they are almost certainly 2FA TOTP / OTP codes
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
      // Duplicate exact login & password -> Ignore
      return;
    }
    // Matching username but changed password -> Offer Update
    notificationPayload = {
      actionType: "update",
      domain,
      username: creds.username,
      password: creds.password,
      itemId: matchingUserItem.id,
    };
  } else {
    // New credential -> Offer Add
    notificationPayload = {
      actionType: "add",
      domain,
      username: creds.username,
      password: creds.password,
    };
  }

  // Save pending notification for this tab (survives page navigation)
  pendingTabNotifications.set(tabId, {
    payload: notificationPayload,
    timestamp: Date.now(),
  });
  lastGlobalPendingNotification = {
    payload: notificationPayload,
    timestamp: Date.now(),
    domain,
  };

  // For AJAX/SPA forms or slow network (where page doesn't navigate within 300ms),
  // send notification to current tab. If user does not interact on Page A and page navigates later,
  // Page B will still receive the prompt cleanly.
  setTimeout(() => {
    const currentPending = pendingTabNotifications.get(tabId);
    if (currentPending && currentPending.payload === notificationPayload) {
      sendMessageToTab(tabId, {
        type: MSG_SHOW_NOTIFICATION_BAR,
        payload: notificationPayload,
      });
    }
  }, 300);
}

async function batchSavePayloads(
  vaultData: { items: VaultItem[]; key: CryptoKey; salt: string },
  payloads: SaveActionPayload[],
): Promise<boolean> {
  if (payloads.length === 0) return true;

  const updatedItems = [...vaultData.items];
  const nowStr = new Date().toISOString();
  let hasRealChanges = false;

  for (const payload of payloads) {
    const payloadDomain = getBaseDomain(payload.domain || "");
    const payloadUser = payload.username.toLowerCase().trim();

    const existingIdx = updatedItems.findIndex((item) => {
      if (!isLoginItem(item)) return false;
      if (payload.itemId && item.id === payload.itemId) {
        return true;
      }
      const itemDomain = getDomainFromItem(item);
      if (!itemDomain) return false;
      const matchDomain = getBaseDomain(itemDomain) === payloadDomain;
      const matchUser =
        (item.login.username || "").toLowerCase().trim() === payloadUser;
      return matchDomain && matchUser;
    });

    if (existingIdx !== -1) {
      const existingItem = updatedItems[existingIdx];
      if (isLoginItem(existingItem)) {
        if (existingItem.login.password === payload.password) {
          // Same Domain + Username + Password -> Duplicate, skip saving
          continue;
        }
        // Same Domain + Username + Different Password -> Update password
        updatedItems[existingIdx] = {
          ...existingItem,
          login: {
            ...existingItem.login,
            password: payload.password,
          },
          revisionDate: nowStr,
        };
        hasRealChanges = true;
      }
    } else {
      // New Login -> Add to vault
      const newItem: LoginVaultItem = {
        id: crypto.randomUUID(),
        type: VaultItemType.Login,
        name: payload.domain || "New Login",
        login: {
          username: payload.username,
          password: payload.password,
          uris: payload.domain ? [{ uri: `https://${payload.domain}` }] : [],
        },
        notes: "",
        favorite: false,
        reprompt: 0,
        fields: [],
        creationDate: nowStr,
        revisionDate: nowStr,
      };
      updatedItems.push(newItem);
      hasRealChanges = true;
    }
  }

  if (!hasRealChanges) {
    return true;
  }

  const encryptRes = await encryptData(
    JSON.stringify(updatedItems),
    vaultData.key,
  );
  if (encryptRes.isErr()) return false;

  const payloadObj = JSON.stringify({
    salt: vaultData.salt,
    iv: encryptRes.value.iv,
    ciphertext: encryptRes.value.ciphertext,
  });

  const setRes = await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payloadObj);
  if (setRes.isErr()) return false;

  vaultData.items = updatedItems;
  const uploadRes = await uploadToGist(payloadObj);
  return uploadRes.isOk();
}

let isProcessingPendingQueue = false;

async function processPendingUnapprovedCredentials(): Promise<void> {
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

  // Immediately remove key from storage to prevent duplicate processing
  await removeLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS);
  pendingTabNotifications.clear();
  lastGlobalPendingNotification = null;

  const vaultData = await getDecryptedVaultItems();
  if (!vaultData) {
    isProcessingPendingQueue = false;
    return;
  }

  const validPayloads: SaveActionPayload[] = [];
  for (const rawItem of pendingItems) {
    const parseRes = SaveActionPayloadSchema.safeParse(rawItem);
    if (parseRes.success) {
      validPayloads.push(parseRes.data);
    }
  }

  if (validPayloads.length > 0) {
    await batchSavePayloads(vaultData, validPayloads);
  }

  isProcessingPendingQueue = false;
}

async function handleSaveCredentialAction(
  rawPayload: unknown,
): Promise<boolean> {
  const parseRes = SaveActionPayloadSchema.safeParse(rawPayload);
  if (!parseRes.success) return false;
  const payload = parseRes.data;

  const vaultData = await getDecryptedVaultItems();
  if (!vaultData) {
    // Vault is locked / user not logged in: queue for later auto-save
    const rawPendingRes = await getLocalItem(
      STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
    );
    const rawPending = rawPendingRes.isOk() ? rawPendingRes.value : null;
    const pendingList: unknown[] = Array.isArray(rawPending) ? rawPending : [];
    pendingList.push(payload);
    await setLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS, pendingList);

    // Automatically open extension popup to prompt user to unlock/login
    await openPopup();
    return true;
  }

  // Combine current payload with any existing queued items into a single batch
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

async function handleCheckAutofillSuggestion(
  domainStr: unknown,
  sendResponse: (res: unknown) => void,
): Promise<void> {
  if (typeof domainStr !== "string" || !domainStr) {
    sendResponse({ success: false, reason: "invalid_domain" });
    return;
  }

  const vaultData = await getDecryptedVaultItems();
  if (!vaultData) {
    // Vault is locked -> silent mode (as requested by user)
    sendResponse({ success: false, reason: "locked" });
    return;
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
    sendResponse({ success: false, reason: "no_matches" });
    return;
  }

  const bestMatch = matchingAccounts[0];

  sendResponse({
    success: true,
    payload: {
      actionType: "autofill",
      domain: domainStr,
      username: bestMatch.username,
      password: bestMatch.password,
      totp: bestMatch.totp,
      accounts: matchingAccounts,
    },
  });
}

// Message listener
chrome.runtime.onMessage.addListener(
  (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    console.debug("[Background] Received message type:", message.type);

    const extensionPageOrigin = chrome.runtime.getURL("");
    const isExtensionSender = sender.url &&
      sender.url.startsWith(extensionPageOrigin);

    const internalMessages = [
      MSG_UPLOAD_TO_GIST,
      MSG_DELETE_GIST,
      MSG_DOWNLOAD_FROM_GIST,
      MSG_VALIDATE_TOKEN,
      MSG_START_GITHUB_OAUTH,
      MSG_GET_PENDING_FIDO2_REQUEST,
      MSG_RESOLVE_FIDO2_REQUEST,
      MSG_REJECT_FIDO2_REQUEST,
      MSG_RESET_TIMEOUT,
      MSG_FIDO2_HEARTBEAT,
    ];

    if (internalMessages.includes(message.type) && !isExtensionSender) {
      console.warn(
        `[Background] Unauthorized message type: ${message.type} from sender:`,
        sender.url,
      );
      sendResponse({ success: false, error: "Unauthorized sender context" });
      return false;
    }

    switch (message.type) {
      case MSG_CHECK_AUTOFILL_SUGGESTION: {
        handleCheckAutofillSuggestion(message.domain, sendResponse);
        return true;
      }

      case MSG_CHECK_PENDING_NOTIFICATION: {
        if (sender.tab && sender.tab.id !== undefined) {
          const pending = pendingTabNotifications.get(sender.tab.id);
          if (pending && Date.now() - pending.timestamp < 120000) {
            sendResponse({ success: true, payload: pending.payload });
            pendingTabNotifications.delete(sender.tab.id);
            return false;
          }
        }
        if (
          lastGlobalPendingNotification &&
          Date.now() - lastGlobalPendingNotification.timestamp < 120000
        ) {
          const payload = lastGlobalPendingNotification.payload;
          lastGlobalPendingNotification = null;
          sendResponse({ success: true, payload });
          return false;
        }
        sendResponse({ success: false });
        return false;
      }

      case MSG_CREDENTIALS_SUBMITTED: {
        if (sender.tab && sender.tab.id !== undefined) {
          handleSubmittedCredentials(message.credentials, sender.tab.id);
        }
        sendResponse({ success: true });
        return false;
      }

      case MSG_SAVE_CREDENTIAL_ACTION: {
        if (sender.tab && sender.tab.id !== undefined) {
          pendingTabNotifications.delete(sender.tab.id);
        }
        lastGlobalPendingNotification = null;

        if (message.choice === "confirm") {
          handleSaveCredentialAction(message.payload).then((ok) => {
            sendResponse({ success: ok });
          });
          return true;
        }
        sendResponse({ success: true });
        return false;
      }

      case MSG_UPLOAD_TO_GIST:
        uploadToGist(message.content || "").then((res) => {
          sendResponse({
            success: res.isOk(),
            error: res.isErr() ? res.error : undefined,
          });
        });
        return true; // Keep channel open

      case MSG_DELETE_GIST:
        deleteGist(message.content || "").then((res) => {
          sendResponse({
            success: res.isOk(),
            error: res.isErr() ? res.error : undefined,
          });
        });
        return true;

      case MSG_DOWNLOAD_FROM_GIST:
        downloadFromGist().then((res) => {
          if (res.isOk()) {
            sendResponse({
              success: true,
              content: res.value.content,
            });
          } else {
            sendResponse({
              success: false,
              error: res.error,
            });
          }
        });
        return true;

      case MSG_VALIDATE_TOKEN:
        validateToken(message.token || "").then((res) => {
          if (res.isOk()) {
            sendResponse({
              success: true,
              username: res.value.username,
              avatarUrl: res.value.avatarUrl,
            });
          } else {
            sendResponse({
              success: false,
              error: res.error,
            });
          }
        });
        return true;

      case MSG_START_GITHUB_OAUTH: {
        const clientId = message.content || "";
        const redirectUri = chrome.identity.getRedirectURL();
        const authUrl =
          `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=gist,read:user&state=${
            encodeURIComponent(redirectUri)
          }`;

        chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true,
        }, async (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            const err = chrome.runtime.lastError?.message ||
              "OAuth flow cancelled or failed";
            sendResponse({ success: false, error: err });
            return;
          }
          const urlRes = safeParseUrl(redirectUrl);
          if (urlRes.isOk()) {
            const token = urlRes.value.searchParams.get("token");
            if (token) {
              await setSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN, token);
              sendResponse({ success: true, token });
            } else {
              sendResponse({
                success: false,
                error: "Token not found in redirect URL",
              });
            }
          } else {
            sendResponse({
              success: false,
              error: "Failed to parse redirect URL: " + urlRes.error,
            });
          }
        });
        return true;
      }

      // FIDO2 / Passkey Messages
      case MSG_FIDO2_CREDENTIAL_CREATION_REQUEST:
      case MSG_FIDO2_CREDENTIAL_GET_REQUEST: {
        const type = message.type === MSG_FIDO2_CREDENTIAL_CREATION_REQUEST
          ? "create"
          : "get";
        if (!sender.tab || sender.tab.id === undefined) {
          sendResponse({ success: false, error: "No sender tab" });
          return false;
        }

        const requestData = {
          type,
          options: message.data,
          origin: sender.origin || new URL(sender.tab.url || "").origin,
          senderTabId: sender.tab.id,
        };

        // Save to chrome.storage.session for durability
        setSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST, requestData);

        // Save callback in memory
        pendingFido2Callback = sendResponse;

        // Open a popup window for verification
        chrome.windows.create({
          url: chrome.runtime.getURL("popup.html?mode=fido2-prompt"),
          type: "popup",
          width: POPUP_WIDTH,
          height: FIDO2_PROMPT_HEIGHT,
          focused: true,
        });
        return true;
      }

      case MSG_GET_PENDING_FIDO2_REQUEST: {
        const handleGetPendingFido2 = async () => {
          const savedRes = await getSessionItem(
            SESSION_KEY_PENDING_FIDO2_REQUEST,
          );
          const saved = savedRes.isOk() ? savedRes.value : null;
          const parsed = PendingFido2RequestSchema.safeParse(saved);
          if (parsed.success) {
            sendResponse({
              success: true,
              type: parsed.data.type,
              options: parsed.data.options,
              origin: parsed.data.origin,
            });
          } else {
            sendResponse({ success: false, error: "No pending request" });
          }
        };
        handleGetPendingFido2();
        return true;
      }

      case MSG_RESOLVE_FIDO2_REQUEST:
        removeSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST);

        if (pendingFido2Callback) {
          pendingFido2Callback({
            success: true,
            result: message.result,
          });
          pendingFido2Callback = null;
          sendResponse({ success: true });
        } else {
          sendResponse({
            success: false,
            error: "No pending request callback found in memory",
          });
        }
        return false;

      case MSG_REJECT_FIDO2_REQUEST:
        removeSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST);

        if (pendingFido2Callback) {
          pendingFido2Callback({
            success: false,
            error: message.error || "User cancelled",
          });
          pendingFido2Callback = null;
          sendResponse({ success: true });
        } else {
          sendResponse({
            success: false,
            error: "No pending request callback found in memory",
          });
        }
        return false;

      case MSG_FIDO2_HEARTBEAT:
        // Heartbeat to keep service worker alive during prompt
        console.debug("[Background] Heartbeat received");
        sendResponse({ success: true });
        return false;

      case MSG_RESET_TIMEOUT:
        updateTimeoutAlarm().then(() => sendResponse({ success: true }));
        return true;

      default:
        return false;
    }
  },
);

// Timeout Alarm Management
async function updateTimeoutAlarm() {
  const resAlarm = await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);
  if (resAlarm.isErr()) {
    return;
  }
  const settingsRes = await getAllSettings();
  if (settingsRes.isErr()) {
    return;
  }
  const settings = settingsRes.value;
  const timeout = settings.vaultTimeout || "onRestart";

  if (timeout !== "onRestart") {
    const minutes = parseInt(timeout, 10);
    if (!isNaN(minutes) && minutes > 0) {
      const derivedKeyRes = await getSessionItem(SESSION_KEY_DERIVED_KEY);
      const derivedKey = derivedKeyRes.isOk() ? derivedKeyRes.value : null;
      if (derivedKey) {
        await createAlarm(ALARM_NAME_VAULT_TIMEOUT, {
          delayInMinutes: minutes,
        });
        console.debug(
          `[Background] Set ${ALARM_NAME_VAULT_TIMEOUT} alarm for ${minutes} minutes`,
        );
      }
    }
  }
}

if (hasAlarms()) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME_VAULT_TIMEOUT) {
      console.debug(
        `[Background] ${ALARM_NAME_VAULT_TIMEOUT} alarm fired. Locking/Logging out...`,
      );
      const settingsRes = await getAllSettings();
      const settings = settingsRes.isOk()
        ? settingsRes.value
        : SettingsSchema.parse({});
      const action = settings.vaultTimeoutAction || "lock";

      // Clear session data and navigation state
      const removeRes = await removeSessionItem([
        SESSION_KEY_DERIVED_KEY,
        SESSION_KEY_VERIFICATION_IV,
        SESSION_KEY_VERIFICATION_CIPHERTEXT,
        SESSION_KEY_GITHUB_TOKEN,
        SESSION_KEY_ENCRYPTED_VAULT,
        SESSION_KEY_LAST_VIEW,
        SESSION_KEY_LAST_SELECTED_ITEM_ID,
      ]);
      if (removeRes.isErr()) {
        console.error(
          "[Background] Failed to clear session items:",
          removeRes.error,
        );
      }

      if (action === "logout") {
        await clearLocal();
        broadcastMessage({ type: MSG_VAULT_LOGGED_OUT });
      } else {
        broadcastMessage({ type: MSG_VAULT_LOCKED });
      }
    }
  });
}

if (hasStorageOnChanged()) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      updateTimeoutAlarm();
    }
    if (areaName === "session" && changes[SESSION_KEY_DERIVED_KEY]?.newValue) {
      processPendingUnapprovedCredentials();
    }
  });
}

// Khởi tạo phiên làm việc và xử lý đăng xuất khi khởi động lại trình duyệt
async function initSession() {
  if (!hasSessionStorage()) {
    return;
  }
  const sessionInitializedRes = await getSessionItem(
    SESSION_KEY_SESSION_INITIALIZED,
  );
  const sessionInitialized = sessionInitializedRes.isOk()
    ? sessionInitializedRes.value
    : null;

  if (!sessionInitialized) {
    const settingsRes = await getAllSettings();
    const settings = settingsRes.isOk()
      ? settingsRes.value
      : SettingsSchema.parse({});
    const action = settings.vaultTimeoutAction || "lock";
    if (action === "logout") {
      console.debug(
        "[Background] Trình duyệt khởi động lại và vaultTimeoutAction là logout. Đang đăng xuất...",
      );
      await clearLocal();
      await clearSession();
    }
    await setSessionItem(SESSION_KEY_SESSION_INITIALIZED, true);
  }
}

initSession();
