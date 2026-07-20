import { APP_NAME } from "@/core/constants.ts";

// Inject fido2-page-script.js into the main page context
const fido2Nonce = crypto.randomUUID();

try {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("fido2-page-script.js");
  script.dataset.nonce = fido2Nonce;
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
} catch (err) {
  console.error(`[${APP_NAME}] Failed to inject FIDO2 page script:`, err);
}

// Forward messages between main-world (page-script) and extension-world (background)
window.addEventListener("message", (event) => {
  // Only handle messages coming from our own page script with correct nonce
  if (
    event.source !== window || !event.data ||
    event.data.source !== `${APP_NAME.toLowerCase()}-page-script` ||
    event.data.nonce !== fido2Nonce
  ) {
    return;
  }

  const { requestId, type, data } = event.data;

  // Send request to background script
  chrome.runtime.sendMessage({ type, data }, (response) => {
    // If runtime.lastError is present, it means the background page is asleep or error
    if (chrome.runtime.lastError) {
      window.postMessage(
        {
          source: `${APP_NAME.toLowerCase()}-content-script`,
          nonce: fido2Nonce,
          requestId,
          success: false,
          error: chrome.runtime.lastError.message ||
            "Background worker unavailable",
        },
        "*",
      );
      return;
    }

    // Forward the response back to page script
    window.postMessage(
      {
        source: `${APP_NAME.toLowerCase()}-content-script`,
        nonce: fido2Nonce,
        requestId,
        success: response?.success || false,
        result: response?.result,
        error: response?.error,
      },
      "*",
    );
  });
});
