import qrcodeParser from "qrcode-parser";
import {
  deleteGist,
  downloadFromGist,
  uploadToGist,
  validateToken,
} from "@/domains/github/api.ts";
import { FIDO2_PROMPT_HEIGHT, POPUP_WIDTH } from "@/shared/constants.ts";

// Pending FIDO2 request state
interface PendingRequest {
  type: "create" | "get";
  options: unknown;
  origin: string;
  senderTabId: number;
  sendResponse: (response: unknown) => void;
}

interface ChromeMessage {
  type: string;
  content?: string;
  token?: string;
  result?: unknown;
  error?: string;
  data?: unknown;
}

let pendingFido2Request: PendingRequest | null = null;

// Message listener
chrome.runtime.onMessage.addListener(
  (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    console.debug("[Background] Received message type:", message.type);

    switch (message.type) {
      case "UPLOAD_TO_GIST":
        uploadToGist(message.content || "").then(sendResponse);
        return true; // Keep channel open

      case "DELETE_GIST":
        deleteGist(message.content || "").then(sendResponse);
        return true;

      case "DOWNLOAD_FROM_GIST":
        downloadFromGist().then(sendResponse);
        return true;

      case "VALIDATE_TOKEN":
        validateToken(message.token || "").then(sendResponse);
        return true;

      case "SCAN_QR_CODE":
        captureAndDecodeQr().then(sendResponse).catch((err) => {
          sendResponse({ success: false, error: err.message || String(err) });
        });
        return true;

      case "START_GITHUB_OAUTH": {
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
      case "FIDO2_CREDENTIAL_CREATION_REQUEST":
      case "FIDO2_CREDENTIAL_GET_REQUEST": {
        const type = message.type === "FIDO2_CREDENTIAL_CREATION_REQUEST"
          ? "create"
          : "get";
        if (!sender.tab || sender.tab.id === undefined) {
          sendResponse({ success: false, error: "No sender tab" });
          return false;
        }

        // Save pending request
        pendingFido2Request = {
          type,
          options: message.data,
          origin: sender.origin || new URL(sender.tab.url || "").origin,
          senderTabId: sender.tab.id,
          sendResponse,
        };

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

      case "GET_PENDING_FIDO2_REQUEST":
        if (pendingFido2Request) {
          sendResponse({
            success: true,
            type: pendingFido2Request.type,
            options: pendingFido2Request.options,
            origin: pendingFido2Request.origin,
          });
        } else {
          sendResponse({ success: false, error: "No pending request" });
        }
        return false;

      case "RESOLVE_FIDO2_REQUEST":
        if (pendingFido2Request) {
          pendingFido2Request.sendResponse({
            success: true,
            result: message.result,
          });
          pendingFido2Request = null;
          sendResponse({ success: true });
        } else {
          sendResponse({
            success: false,
            error: "No pending request to resolve",
          });
        }
        return false;

      case "REJECT_FIDO2_REQUEST":
        if (pendingFido2Request) {
          pendingFido2Request.sendResponse({
            success: false,
            error: message.error || "User cancelled",
          });
          pendingFido2Request = null;
          sendResponse({ success: true });
        } else {
          sendResponse({
            success: false,
            error: "No pending request to reject",
          });
        }
        return false;

      default:
        return false;
    }
  },
);

// Helper function to capture the active tab and parse the QR code
async function captureAndDecodeQr(): Promise<
  { success: boolean; secret?: string; error?: string }
> {
  try {
    // 1. Capture the visible tab as a PNG data URL
    const screenshot = await chrome.tabs.captureVisibleTab({ format: "png" });
    if (!screenshot) {
      return { success: false, error: "Failed to capture screenshot of tab" };
    }

    // 2. Parse the QR code
    const decoded = await qrcodeParser(screenshot);
    if (!decoded) {
      return { success: false, error: "No QR code found on screen" };
    }

    const decodedStr = decoded.toString();
    console.debug("[Background] Decoded QR Code URL:", decodedStr);

    // 3. Check if it is a valid otpauth url
    try {
      const url = new URL(decodedStr);
      if (url.protocol === "otpauth:" && url.searchParams.has("secret")) {
        const secret = url.searchParams.get("secret") || "";
        return { success: true, secret };
      } else {
        return {
          success: false,
          error: "QR code is not a valid TOTP URL (missing secret)",
        };
      }
    } catch (_e) {
      return { success: false, error: "QR code does not contain a valid URL" };
    }
  } catch (err) {
    console.error("[Background] QR Capture error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg || "Failed to parse QR code" };
  }
}
