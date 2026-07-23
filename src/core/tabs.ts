/**
 * Utility functions for interacting with Chrome tabs
 */
import { err, ok, Result, ResultAsync } from "neverthrow";
import { type TranslationKey } from "@/core/i18n.ts";

export async function getCurrentTab(): Promise<
  Result<chrome.tabs.Tab | null, TranslationKey>
> {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
    return ok(null);
  }

  const queryRes = await ResultAsync.fromPromise(
    chrome.tabs.query({ active: true, currentWindow: true }),
    (e): TranslationKey => {
      console.warn("Failed to get current tab:", e);
      return "tab_error_get_current";
    },
  );
  if (queryRes.isErr()) return err(queryRes.error);

  const tabs = queryRes.value;
  return ok(tabs && tabs.length > 0 ? tabs[0] : null);
}

/**
 * Send a message to a specific tab and wait for a response
 */
export async function sendMessageToTab(
  tabId: number,
  message: unknown,
): Promise<Result<unknown, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.sendMessage
  ) {
    return err("tab_error_send_message");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.tabs.sendMessage(tabId, message),
    (e): TranslationKey => {
      console.warn("Failed to send message to tab:", e);
      return "tab_error_send_message";
    },
  );
  if (sendRes.isErr()) return err(sendRes.error);
  return ok(sendRes.value);
}

/**
 * Capture the visible area of the currently active tab in the specified window.
 */
export async function captureVisibleTab(
  options?: { format?: "jpeg" | "png"; quality?: number },
): Promise<Result<string, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.tabs ||
    !chrome.tabs.captureVisibleTab
  ) {
    return err("tab_error_capture");
  }

  const opts = options || { format: "png" };
  const captureRes = await ResultAsync.fromPromise(
    chrome.tabs.captureVisibleTab(opts),
    (e): TranslationKey => {
      console.warn("Failed to capture visible tab:", e);
      return "tab_error_capture";
    },
  );
  if (captureRes.isErr()) return err(captureRes.error);
  if (!captureRes.value) return err("tab_error_capture");
  return ok(captureRes.value);
}

/**
 * Open a new tab with the specified URL, falling back to window.open if chrome.tabs is unavailable.
 */
export async function openTab(
  url: string,
): Promise<Result<chrome.tabs.Tab | null, TranslationKey>> {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.create) {
    return Result.fromThrowable(
      () => {
        window.open(url, "_blank");
        return null;
      },
      (e): TranslationKey => {
        console.warn("Failed to open URL in window.open:", e);
        return "tab_error_open";
      },
    )();
  }

  const createRes = await ResultAsync.fromPromise(
    chrome.tabs.create({ url }),
    (e): TranslationKey => {
      console.warn("Failed to open tab via chrome.tabs:", e);
      return "tab_error_open";
    },
  );
  if (createRes.isErr()) return err(createRes.error);
  return ok(createRes.value);
}

/**
 * Automatically open extension popup if supported by browser action API.
 */
export async function openPopup(): Promise<Result<void, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.action ||
    !chrome.action.openPopup
  ) {
    return err("tab_error_open");
  }

  const openRes = await ResultAsync.fromPromise(
    chrome.action.openPopup(),
    (e): TranslationKey => {
      console.warn("Failed to open extension popup:", e);
      return "tab_error_open";
    },
  );
  if (openRes.isErr()) return err(openRes.error);
  return ok();
}
