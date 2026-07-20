import { MSG_AUTOFILL_CREDENTIALS } from "@/core/constants.ts";

import { performAutofill } from "@/extension/autofill-core.ts";

// Listen for fill message from extension popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MSG_AUTOFILL_CREDENTIALS) {
    const { username, password } = message;
    const success = performAutofill(username, password);
    sendResponse({ success });
  }
});
