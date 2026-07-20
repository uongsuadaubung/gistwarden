/**
 * Utility functions for interacting with Chrome tabs
 */

export function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
      resolve(null);
      return;
    }

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "Failed to get current tab:",
            chrome.runtime.lastError.message,
          );
          resolve(null);
          return;
        }
        resolve(tabs && tabs.length > 0 ? tabs[0] : null);
      });
    } catch (_err) {
      resolve(null);
    }
  });
}

/**
 * Send a message to a specific tab and wait for a response
 */
export function sendMessageToTab(
  tabId: number,
  message: unknown,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (
      typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.sendMessage
    ) {
      reject(new Error("chrome.tabs.sendMessage is not available"));
      return;
    }

    try {
      chrome.tabs.sendMessage(tabId, message, (response: unknown) => {
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
 * Capture the visible area of the currently active tab in the specified window.
 */
export function captureVisibleTab(
  options?: { format?: "jpeg" | "png"; quality?: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (
      typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.captureVisibleTab
    ) {
      reject(new Error("chrome.tabs.captureVisibleTab is not available"));
      return;
    }

    try {
      const opts = options || { format: "png" };
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
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
