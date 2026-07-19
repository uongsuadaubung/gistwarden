import { z } from "zod";
import {
  deleteGist,
  downloadFromGist,
  uploadToGist,
  validateToken,
} from "@/domains/github/api.ts";
import {
  ALARM_NAME_VAULT_TIMEOUT,
  FIDO2_PROMPT_HEIGHT,
  MSG_DELETE_GIST,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_FIDO2_CREDENTIAL_CREATION_REQUEST,
  MSG_FIDO2_CREDENTIAL_GET_REQUEST,
  MSG_FIDO2_HEARTBEAT,
  MSG_GET_PENDING_FIDO2_REQUEST,
  MSG_REJECT_FIDO2_REQUEST,
  MSG_RESET_TIMEOUT,
  MSG_RESOLVE_FIDO2_REQUEST,
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
  SESSION_KEY_SESSION_INITIALIZED,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
} from "@/shared/constants.ts";
import {
  getAllSettings,
  getSessionItem,
  hasAlarms,
  hasSessionStorage,
  hasStorageOnChanged,
  removeSessionItem,
  setSessionItem,
  STORAGE_KEY,
} from "@/shared/storage.ts";

const PendingFido2RequestSchema = z.object({
  type: z.enum(["create", "get"]),
  options: z.unknown(),
  origin: z.string(),
  senderTabId: z.number(),
});

interface ChromeMessage {
  type: string;
  content?: string;
  token?: string;
  result?: unknown;
  error?: string;
  data?: unknown;
}

let pendingFido2Callback: ((response: unknown) => void) | null = null;

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
      case MSG_UPLOAD_TO_GIST:
        uploadToGist(message.content || "").then(sendResponse);
        return true; // Keep channel open

      case MSG_DELETE_GIST:
        deleteGist(message.content || "").then(sendResponse);
        return true;

      case MSG_DOWNLOAD_FROM_GIST:
        downloadFromGist().then(sendResponse);
        return true;

      case MSG_VALIDATE_TOKEN:
        validateToken(message.token || "").then(sendResponse);
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
        }, (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            const err = chrome.runtime.lastError?.message ||
              "OAuth flow cancelled or failed";
            sendResponse({ success: false, error: err });
            return;
          }
          try {
            const parsedUrl = new URL(redirectUrl);
            const token = parsedUrl.searchParams.get("token");
            if (token) {
              sendResponse({ success: true, token });
            } else {
              sendResponse({
                success: false,
                error: "Token not found in redirect URL",
              });
            }
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            sendResponse({
              success: false,
              error: "Failed to parse redirect URL: " + errMsg,
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

      case MSG_GET_PENDING_FIDO2_REQUEST:
        getSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST).then((saved) => {
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
        }).catch((err) => {
          sendResponse({ success: false, error: String(err) });
        });
        return true;

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
  if (!hasAlarms()) return;
  await chrome.alarms.clear(ALARM_NAME_VAULT_TIMEOUT);

  try {
    const settings = await getAllSettings();
    const timeout = settings.vaultTimeout || "onRestart";

    if (timeout !== "onRestart") {
      const minutes = parseInt(timeout, 10);
      if (!isNaN(minutes) && minutes > 0) {
        const derivedKey = await getSessionItem(SESSION_KEY_DERIVED_KEY);
        if (derivedKey) {
          chrome.alarms.create(ALARM_NAME_VAULT_TIMEOUT, {
            delayInMinutes: minutes,
          });
          console.debug(
            `[Background] Set ${ALARM_NAME_VAULT_TIMEOUT} alarm for ${minutes} minutes`,
          );
        }
      }
    }
  } catch (err) {
    console.error("[Background] Failed to update timeout alarm:", err);
  }
}

if (hasAlarms()) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME_VAULT_TIMEOUT) {
      console.debug(
        `[Background] ${ALARM_NAME_VAULT_TIMEOUT} alarm fired. Locking/Logging out...`,
      );
      try {
        const settings = await getAllSettings();
        const action = settings.vaultTimeoutAction || "lock";

        // Clear session data and navigation state
        await removeSessionItem([
          SESSION_KEY_DERIVED_KEY,
          SESSION_KEY_VERIFICATION_IV,
          SESSION_KEY_VERIFICATION_CIPHERTEXT,
          SESSION_KEY_GITHUB_TOKEN,
          SESSION_KEY_ENCRYPTED_VAULT,
          SESSION_KEY_LAST_VIEW,
          SESSION_KEY_LAST_SELECTED_ITEM_ID,
        ]);

        if (action === "logout") {
          await chrome.storage.local.clear();
          chrome.runtime.sendMessage({ type: MSG_VAULT_LOGGED_OUT }).catch(
            () => {},
          );
        } else {
          chrome.runtime.sendMessage({ type: MSG_VAULT_LOCKED }).catch(
            () => {},
          );
        }
      } catch (err) {
        console.error("[Background] Failed to execute timeout action:", err);
      }
    }
  });
}

if (hasStorageOnChanged()) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      updateTimeoutAlarm();
    }
  });
}

// Khởi tạo phiên làm việc và xử lý đăng xuất khi khởi động lại trình duyệt
async function initSession() {
  if (!hasSessionStorage()) {
    return;
  }
  try {
    const res = await chrome.storage.session.get(
      SESSION_KEY_SESSION_INITIALIZED,
    );
    if (!res || !res[SESSION_KEY_SESSION_INITIALIZED]) {
      // Lần đầu tiên chạy service worker trong phiên trình duyệt này (trình duyệt khởi động lại)
      const settings = await getAllSettings();
      const action = settings.vaultTimeoutAction || "lock";
      if (action === "logout") {
        console.debug(
          "[Background] Trình duyệt khởi động lại và vaultTimeoutAction là logout. Đang đăng xuất...",
        );
        await chrome.storage.local.clear();
        await chrome.storage.session.clear();
      }
      await chrome.storage.session.set({
        [SESSION_KEY_SESSION_INITIALIZED]: true,
      });
    }
  } catch (err) {
    console.error("[Background] Lỗi khi khởi tạo phiên làm việc:", err);
  }
}

initSession();
