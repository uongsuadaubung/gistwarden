import { z } from "zod";
import {
  MSG_AUTOFILL_CREDENTIALS,
  MSG_CHECK_PENDING_NOTIFICATION,
  MSG_CREDENTIALS_SUBMITTED,
  MSG_SHOW_NOTIFICATION_BAR,
} from "@/core/constants.ts";

import {
  performAutofill,
  setupFormSubmitMonitoring,
  type SubmittedCredentials,
} from "@/extension/autofill-core.ts";
import { showNotificationBar } from "@/features/notification/index.ts";
import { getBaseDomain } from "@/core/domain-utils.ts";

const NotificationPayloadSchema = z.object({
  actionType: z.enum(["add", "update"]),
  domain: z.string(),
  username: z.string(),
  password: z.string(),
  itemId: z.string().optional(),
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MSG_AUTOFILL_CREDENTIALS) {
    const username = typeof message.username === "string"
      ? message.username
      : undefined;
    const password = typeof message.password === "string"
      ? message.password
      : undefined;
    const success = performAutofill(username, password);
    sendResponse({ success });
    return;
  }

  if (message.type === MSG_SHOW_NOTIFICATION_BAR) {
    const parseRes = NotificationPayloadSchema.safeParse(message.payload);
    if (parseRes.success) {
      showNotificationBar(parseRes.data);
    }
  }
});

// Setup monitoring for form submit
setupFormSubmitMonitoring((creds: SubmittedCredentials) => {
  chrome.runtime.sendMessage({
    type: MSG_CREDENTIALS_SUBMITTED,
    credentials: creds,
  });
});

// Check if there is a pending notification bar for this tab upon page load
const currentDomain = getBaseDomain(window.location.href);
chrome.runtime.sendMessage(
  { type: MSG_CHECK_PENDING_NOTIFICATION, content: currentDomain },
  (response) => {
    if (chrome.runtime.lastError) return;
    if (response && response.success && response.payload) {
      const parseRes = NotificationPayloadSchema.safeParse(response.payload);
      if (parseRes.success) {
        showNotificationBar(parseRes.data);
      }
    }
  },
);
