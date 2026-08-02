import {
  MSG_AUTOFILL_CREDENTIALS,
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
import { writeClipboardText } from "@/core/clipboard-utils.ts";
import { getLocalItem, isRecord } from "@/core/storage.ts";
import {
  notifyBackground,
  onExtensionMessage,
  sendBackgroundMessage,
} from "@/core/messaging.ts";
import {
  checkAutofillSuggestionRoute,
  checkPendingNotificationRoute,
  generateTotpRoute,
} from "@gistwarden/orchestrator";
import {
  type AutofillMatchingAccount,
  NotificationPayloadSchema,
} from "@gistwarden/domain";

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
const currentDomain = window.location.hostname
  ? window.location.hostname.replace(/^www\./i, "")
  : window.location.host;

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

  const msgRes = await sendBackgroundMessage(
    checkAutofillSuggestionRoute,
    { domain: currentDomain },
  );

  if (msgRes.isErr() || !msgRes.value.success) return;
  const payloadData = msgRes.value.payload;

  showNotificationBar({
    ...payloadData,
    onFill: async (selectedAcc?: AutofillMatchingAccount) => {
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
        const totpRes = await sendBackgroundMessage(generateTotpRoute, {
          secret: tSecret,
        });
        if (totpRes.isOk() && totpRes.value.success && totpRes.value.code) {
          await writeClipboardText(totpRes.value.code);
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
});

// Check if there is a pending notification bar for this tab upon page load
const checkPendingNotification = async () => {
  const msgRes = await sendBackgroundMessage(
    checkPendingNotificationRoute,
    { content: currentDomain },
  );
  if (msgRes.isOk() && msgRes.value.success) {
    const parseRes = NotificationPayloadSchema.safeParse(msgRes.value.payload);
    if (parseRes.success) {
      showNotificationBar(parseRes.data);
    }
  }
};
checkPendingNotification();
