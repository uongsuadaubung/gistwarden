import {
  MSG_AUTOFILL_CREDENTIALS,
  MSG_CHECK_AUTOFILL_SUGGESTION,
  MSG_CHECK_PENDING_NOTIFICATION,
  MSG_CREDENTIALS_SUBMITTED,
  MSG_SHOW_NOTIFICATION_BAR,
  STORAGE_KEY,
} from "@/core/constants.ts";

import {
  performAutofill,
  setupAutofillFocusMonitoring,
  setupFormSubmitMonitoring,
  type SubmittedCredentials,
} from "@/extension/autofill-core.ts";
import { showNotificationBar } from "@/features/notification/index.ts";
import { getBaseDomain } from "@/core/domain-utils.ts";
import { generateTotpSafe } from "@/core/totp-utils.ts";
import { writeClipboardText } from "@/core/clipboard-utils.ts";
import { getLocalItem, isRecord } from "@/core/storage.ts";
import {
  NotificationPayloadSchema,
  notifyBackground,
  onExtensionMessage,
  sendMessageToBackground,
} from "@/core/messaging.ts";

// Listen for messages from background script
onExtensionMessage((message, _sender, sendResponse) => {
  if (!isRecord(message)) return;

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
  notifyBackground({
    type: MSG_CREDENTIALS_SUBMITTED,
    credentials: creds,
  });
});

// Setup monitoring for focus on login input fields to show Autofill Suggestion Toast (when unlocked)
let autofillDismissedForTab = false;
let isProgrammaticAutofilling = false;
const currentDomain = window.location.hostname ||
  getBaseDomain(window.location.href);

setupAutofillFocusMonitoring(async () => {
  if (autofillDismissedForTab || isProgrammaticAutofilling) return;

  const storageRes = await getLocalItem(STORAGE_KEY);
  let showSuggestions = true;
  const raw = storageRes.isOk() ? storageRes.value : null;
  if (
    isRecord(raw) &&
    typeof raw.showAutofillSuggestionsOnFocus === "boolean"
  ) {
    showSuggestions = raw.showAutofillSuggestionsOnFocus;
  }
  if (!showSuggestions) return;

  const msgRes = await sendMessageToBackground({
    type: MSG_CHECK_AUTOFILL_SUGGESTION,
    domain: currentDomain,
  });

  if (!msgRes.isOk()) return;
  const response = msgRes.value;

  if (isRecord(response) && response.success && response.payload) {
    const parseRes = NotificationPayloadSchema.safeParse(response.payload);
    if (parseRes.success && parseRes.data.actionType === "autofill") {
      const payloadData = parseRes.data;
      showNotificationBar({
        ...payloadData,
        onFill: async (selectedAcc) => {
          isProgrammaticAutofilling = true;
          const u = selectedAcc?.username || payloadData.username;
          const p = selectedAcc?.password || payloadData.password;
          const tSecret = selectedAcc?.totp || payloadData.totp;

          const res = await getLocalItem(STORAGE_KEY);
          let autoSubmit = true;
          const rawLocal = res.isOk() ? res.value : null;
          if (
            isRecord(rawLocal) &&
            typeof rawLocal.autoSubmitOnAutofill === "boolean"
          ) {
            autoSubmit = rawLocal.autoSubmitOnAutofill;
          }
          performAutofill(u, p, autoSubmit);

          if (tSecret) {
            const totpRes = generateTotpSafe(tSecret);
            if (totpRes.isOk()) {
              writeClipboardText(totpRes.value);
            }
          }

          setTimeout(() => {
            isProgrammaticAutofilling = false;
          }, 500);
        },
        onDismiss: () => {
          autofillDismissedForTab = true;
        },
      });
    }
  }
});

// Check if there is a pending notification bar for this tab upon page load
const checkPendingNotification = async () => {
  const msgRes = await sendMessageToBackground({
    type: MSG_CHECK_PENDING_NOTIFICATION,
    content: currentDomain,
  });
  if (!msgRes.isOk()) return;
  const response = msgRes.value;
  if (isRecord(response) && response.success && response.payload) {
    const parseRes = NotificationPayloadSchema.safeParse(response.payload);
    if (parseRes.success) {
      showNotificationBar(parseRes.data);
    }
  }
};
checkPendingNotification();
