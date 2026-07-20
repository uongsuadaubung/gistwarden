/**
 * Core utilities for messaging between extension components.
 */

/**
 * Send a message to the background script and wait for a response.
 * Handles API availability checks and wraps chrome.runtime.lastError.
 */
export function sendMessageToBackground(message: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (
      typeof chrome === "undefined" || !chrome.runtime ||
      !chrome.runtime.sendMessage
    ) {
      reject(new Error("chrome.runtime.sendMessage is not available"));
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response: unknown) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Send a message to the background script in a fire-and-forget manner.
 * Use this for signals that do not require a response (e.g., MSG_RESET_TIMEOUT).
 */
export function notifyBackground(message: unknown): void {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return;
  }

  try {
    chrome.runtime.sendMessage(message).catch(() => {});
  } catch (_e) {
    // Ignore errors
  }
}

/**
 * Broadcast a message from the background script to all other parts of the extension.
 * This is effectively the same API as notifyBackground, but named differently
 * to express the intent of the caller (background broadcasting state changes).
 */
export function broadcastMessage(message: unknown): void {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return;
  }

  try {
    chrome.runtime.sendMessage(message).catch(() => {});
  } catch (_e) {
    // Ignore errors
  }
}
