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
      return "toast_error";
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
    return err("toast_error");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.tabs.sendMessage(tabId, message),
    (e): TranslationKey => {
      console.warn("Failed to send message to tab:", e);
      return "toast_error";
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
    return err("toast_error");
  }

  const opts = options || { format: "png" };
  const captureRes = await ResultAsync.fromPromise(
    chrome.tabs.captureVisibleTab(opts),
    (e): TranslationKey => {
      console.warn("Failed to capture visible tab:", e);
      return "toast_error";
    },
  );
  if (captureRes.isErr()) return err(captureRes.error);
  if (!captureRes.value) return err("toast_error");
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
        return "toast_error";
      },
    )();
  }

  const createRes = await ResultAsync.fromPromise(
    chrome.tabs.create({ url }),
    (e): TranslationKey => {
      console.warn("Failed to open tab via chrome.tabs:", e);
      return "toast_error";
    },
  );
  if (createRes.isErr()) return err(createRes.error);
  return ok(createRes.value);
}
