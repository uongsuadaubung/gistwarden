/**
 * Utility functions for interacting with Chrome tabs
 */
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { type TranslationKey } from "@/core/i18n.ts";

export function getCurrentTab(): ResultAsync<
  chrome.tabs.Tab | null,
  TranslationKey
> {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
    return okAsync(null);
  }

  return ResultAsync.fromPromise(
    new Promise<chrome.tabs.Tab | null>((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(tabs && tabs.length > 0 ? tabs[0] : null);
      });
    }),
    (e): TranslationKey => {
      console.warn("Failed to get current tab:", e);
      return "toast_error";
    },
  );
}

/**
 * Send a message to a specific tab and wait for a response
 */
export function sendMessageToTab(
  tabId: number,
  message: unknown,
): ResultAsync<unknown, TranslationKey> {
  if (
    typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.sendMessage
  ) {
    return errAsync("toast_error");
  }

  return ResultAsync.fromPromise(
    new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response: unknown) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    }),
    (e): TranslationKey => {
      console.warn("Failed to send message to tab:", e);
      return "toast_error";
    },
  );
}

/**
 * Capture the visible area of the currently active tab in the specified window.
 */
export function captureVisibleTab(
  options?: { format?: "jpeg" | "png"; quality?: number },
): ResultAsync<string, TranslationKey> {
  if (
    typeof chrome === "undefined" || !chrome.tabs ||
    !chrome.tabs.captureVisibleTab
  ) {
    return errAsync("toast_error");
  }

  const opts = options || { format: "png" };
  return ResultAsync.fromPromise(
    new Promise<string>((resolve, reject) => {
      chrome.tabs.captureVisibleTab(opts, (dataUrl: string) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!dataUrl) {
          reject(new Error("Failed to capture visible tab"));
          return;
        }
        resolve(dataUrl);
      });
    }),
    (e): TranslationKey => {
      console.warn("Failed to capture visible tab:", e);
      return "toast_error";
    },
  );
}

/**
 * Open a new tab with the specified URL, falling back to window.open if chrome.tabs is unavailable.
 */
export function openTab(
  url: string,
): ResultAsync<chrome.tabs.Tab | null, TranslationKey> {
  if (
    typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.create
  ) {
    const windowOpenRes = ResultAsync.fromPromise(
      Promise.resolve().then(() => {
        window.open(url, "_blank");
        return null;
      }),
      (e): TranslationKey => {
        console.warn("Failed to open URL in window.open:", e);
        return "toast_error";
      },
    );
    return windowOpenRes;
  }

  return ResultAsync.fromPromise(
    new Promise<chrome.tabs.Tab | null>((resolve, reject) => {
      chrome.tabs.create({ url }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(tab || null);
      });
    }),
    (e): TranslationKey => {
      console.warn("Failed to open tab via chrome.tabs:", e);
      return "toast_error";
    },
  );
}
