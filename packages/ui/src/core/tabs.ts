/**
 * Utility functions for interacting with Chrome tabs
 */
import { err, ok, Result } from "neverthrow";
import { type TranslationKey } from "@gistwarden/domain";

export async function getCurrentTab(): Promise<
  Result<chrome.tabs.Tab | null, TranslationKey>
> {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
    return ok(null);
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return ok(tabs && tabs.length > 0 ? tabs[0] : null);
  } catch (e) {
    console.warn("Failed to get current tab:", e);
    return err("tab_error_get_current");
  }
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

  try {
    const res = await chrome.tabs.sendMessage(tabId, message);
    return ok(res);
  } catch (e) {
    console.warn("Failed to send message to tab:", e);
    return err("tab_error_send_message");
  }
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
  try {
    const res = await chrome.tabs.captureVisibleTab(opts);
    if (!res) return err("tab_error_capture");
    return ok(res);
  } catch (e) {
    console.warn("Failed to capture visible tab:", e);
    return err("tab_error_capture");
  }
}

/**
 * Open a new tab with the specified URL, falling back to window.open if chrome.tabs is unavailable.
 */
export async function openTab(
  url: string,
): Promise<Result<chrome.tabs.Tab | null, TranslationKey>> {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.create) {
    try {
      window.open(url, "_blank");
      return ok(null);
    } catch (e) {
      console.warn("Failed to open URL in window.open:", e);
      return err("tab_error_open");
    }
  }

  try {
    const tab = await chrome.tabs.create({ url });
    return ok(tab);
  } catch (e) {
    console.warn("Failed to open tab via chrome.tabs:", e);
    return err("tab_error_open");
  }
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

  try {
    await chrome.action.openPopup();
    return ok();
  } catch (e) {
    console.warn("Failed to open extension popup:", e);
    return err("tab_error_open");
  }
}
