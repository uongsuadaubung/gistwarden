import { z } from "zod";
import {
  MSG_AUTOFILL_CREDENTIALS,
  MSG_CHECK_AUTOFILL_SUGGESTION,
  MSG_CHECK_PENDING_NOTIFICATION,
  MSG_CREDENTIALS_SUBMITTED,
  MSG_SHOW_NOTIFICATION_BAR,
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
import { isRecord, STORAGE_KEY } from "@/core/storage.ts";

const SaveCredentialPayloadSchema = z.object({
  actionType: z.enum(["add", "update"]),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  itemId: z.string().optional(),
});

const AccountItemSchema = z.object({
  itemId: z.string(),
  name: z.string().optional(),
  username: z.string(),
  password: z.string().optional(),
  totp: z.string().optional(),
});

const AutofillSuggestionPayloadSchema = z.object({
  actionType: z.literal("autofill"),
  domain: z.string(),
  username: z.string(),
  password: z.string().optional(),
  itemId: z.string().optional(),
  totp: z.string().optional(),
  accounts: z.array(AccountItemSchema).optional(),
});

const NotificationPayloadSchema = z.discriminatedUnion("actionType", [
  SaveCredentialPayloadSchema,
  AutofillSuggestionPayloadSchema,
]);

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

// Setup monitoring for focus on login input fields to show Autofill Suggestion Toast (when unlocked)
let autofillDismissedForTab = false;
let isProgrammaticAutofilling = false;
const currentDomain = window.location.hostname ||
  getBaseDomain(window.location.href);

setupAutofillFocusMonitoring(() => {
  if (autofillDismissedForTab || isProgrammaticAutofilling) return;
  chrome.runtime.sendMessage(
    { type: MSG_CHECK_AUTOFILL_SUGGESTION, domain: currentDomain },
    (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.success && response.payload) {
        const parseRes = NotificationPayloadSchema.safeParse(response.payload);
        if (parseRes.success && parseRes.data.actionType === "autofill") {
          const payloadData = parseRes.data;
          showNotificationBar({
            ...payloadData,
            onFill: (selectedAcc) => {
              isProgrammaticAutofilling = true;
              const u = selectedAcc?.username || payloadData.username;
              const p = selectedAcc?.password || payloadData.password;
              const tSecret = selectedAcc?.totp || payloadData.totp;

              chrome.storage.local.get(STORAGE_KEY, (res) => {
                let autoSubmit = true;
                const raw = res ? res[STORAGE_KEY] : null;
                if (
                  isRecord(raw) && typeof raw.autoSubmitOnAutofill === "boolean"
                ) {
                  autoSubmit = raw.autoSubmitOnAutofill;
                }
                performAutofill(u, p, autoSubmit);
              });

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
    },
  );
});

// Check if there is a pending notification bar for this tab upon page load
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
