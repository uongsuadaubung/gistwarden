import {
  type CheckAutofillSuggestionMsg,
  type CheckAutofillSuggestionResponse,
  type CheckPendingNotificationMsg,
  type CheckPendingNotificationResponse,
  type CredentialsSubmittedMsg,
  type SaveCredentialActionMsg,
  type SaveCredentialActionResponse,
  getBaseDomain,
  isRecord,
} from "@gistwarden/domain";
import {
  checkAutofillSuggestionRoute,
  checkAutofillSuggestionUseCase,
  checkPendingNotificationRoute,
  credentialsSubmittedRoute,
  pendingNotificationManager,
  processSubmittedCredentialsUseCase,
  type SimpleSuccessResponse,
  saveCredentialActionRoute,
  saveCredentialActionUseCase,
} from "@gistwarden/orchestrator";
import type {
  MessageContext,
  MessageRouter,
} from "@/extension/message-router.ts";

export async function handleSaveCredentialAction(
  rawPayload: unknown,
): Promise<boolean> {
  return await saveCredentialActionUseCase(rawPayload);
}

export async function handleCheckAutofillSuggestion(
  payload: CheckAutofillSuggestionMsg,
  context?: MessageContext,
): Promise<CheckAutofillSuggestionResponse> {
  if (!payload.domain) {
    return { success: false, reason: "invalid_domain" };
  }

  if (context && !context.isExtensionSender) {
    const senderUrl = context.sender.url || context.sender.tab?.url;
    if (!senderUrl) {
      return { success: false, reason: "invalid_domain" };
    }
    const senderBaseDomain = getBaseDomain(senderUrl);
    const requestedBaseDomain = getBaseDomain(payload.domain);
    if (!senderBaseDomain || senderBaseDomain !== requestedBaseDomain) {
      console.warn(
        `[Autofill] Rejected domain spoofing attempt: sender=${senderBaseDomain}, requested=${requestedBaseDomain}`,
      );
      return { success: false, reason: "invalid_domain" };
    }
  }

  return await checkAutofillSuggestionUseCase(payload.domain);
}

export async function handleCheckPendingNotification(
  _payload: CheckPendingNotificationMsg,
  context: MessageContext,
): Promise<CheckPendingNotificationResponse> {
  if (context.sender.tab && context.sender.tab.id !== undefined) {
    const pending = await pendingNotificationManager.getTabNotification(
      context.sender.tab.id,
    );
    if (pending && Date.now() - pending.timestamp < 120000) {
      await pendingNotificationManager.deleteTabNotification(
        context.sender.tab.id,
      );
      return { success: true, payload: pending.payload };
    }
  }
  const globalPending =
    await pendingNotificationManager.getGlobalNotification();
  if (globalPending && Date.now() - globalPending.timestamp < 120000) {
    const payload = globalPending.payload;
    await pendingNotificationManager.setGlobalNotification(null);
    return { success: true, payload };
  }
  return { success: false };
}

export async function handleCredentialsSubmitted(
  payload: CredentialsSubmittedMsg,
  context: MessageContext,
): Promise<SimpleSuccessResponse> {
  if (context.sender.tab && context.sender.tab.id !== undefined) {
    if (!context.isExtensionSender && isRecord(payload.credentials)) {
      const senderUrl = context.sender.url || context.sender.tab.url;
      if (senderUrl) {
        const senderBaseDomain = getBaseDomain(senderUrl);
        const credsDomain =
          typeof payload.credentials.domain === "string"
            ? getBaseDomain(payload.credentials.domain)
            : typeof payload.credentials.url === "string"
              ? getBaseDomain(payload.credentials.url)
              : "";
        if (!senderBaseDomain || senderBaseDomain !== credsDomain) {
          console.warn(
            `[Autofill] Rejected mismatched credentials submitted: sender=${senderBaseDomain}, creds=${credsDomain}`,
          );
          return { success: true };
        }
      }
    }
    await processSubmittedCredentialsUseCase(
      payload.credentials,
      context.sender.tab.id,
    );
  }
  return { success: true };
}

export async function handleSaveCredentialActionRoute(
  payload: SaveCredentialActionMsg,
  context: MessageContext,
): Promise<SaveCredentialActionResponse> {
  if (context.sender.tab && context.sender.tab.id !== undefined) {
    await pendingNotificationManager.deleteTabNotification(
      context.sender.tab.id,
    );
  }
  await pendingNotificationManager.setGlobalNotification(null);

  if (payload.choice === "confirm") {
    const ok = await handleSaveCredentialAction(payload.payload);
    return { success: ok };
  }
  return { success: true };
}

export function registerAutofillRoutes(router: MessageRouter): void {
  router
    .register(checkAutofillSuggestionRoute, handleCheckAutofillSuggestion)
    .register(checkPendingNotificationRoute, handleCheckPendingNotification)
    .register(credentialsSubmittedRoute, handleCredentialsSubmitted)
    .register(saveCredentialActionRoute, handleSaveCredentialActionRoute);
}
