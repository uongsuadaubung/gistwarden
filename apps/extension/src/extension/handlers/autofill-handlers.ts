import type {
  MessageContext,
  MessageRouter,
} from "@/extension/message-router.ts";
import { type SimpleSuccessResponse } from "@gistwarden/repository";
import {
  checkAutofillSuggestionRoute,
  checkAutofillSuggestionUseCase,
  checkPendingNotificationRoute,
  credentialsSubmittedRoute,
  generateTotpRoute,
  pendingNotificationManager,
  processSubmittedCredentialsUseCase,
  saveCredentialActionRoute,
  saveCredentialActionUseCase,
} from "@gistwarden/orchestrator";
import {
  type CheckAutofillSuggestionMsg,
  type CheckAutofillSuggestionResponse,
  type CheckPendingNotificationMsg,
  type CheckPendingNotificationResponse,
  type CredentialsSubmittedMsg,
  generateTotpSafe,
  type SaveCredentialActionMsg,
  type SaveCredentialActionResponse,
  type TranslationKey,
} from "@gistwarden/domain";

export async function handleSaveCredentialAction(
  rawPayload: unknown,
): Promise<boolean> {
  return await saveCredentialActionUseCase(rawPayload);
}

export async function handleCheckAutofillSuggestion(
  payload: CheckAutofillSuggestionMsg,
): Promise<CheckAutofillSuggestionResponse> {
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
  const globalPending = await pendingNotificationManager
    .getGlobalNotification();
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

export async function handleGenerateTotp(
  payload: { secret: string },
): Promise<{ success: boolean; code?: string; errorKey?: TranslationKey }> {
  const totpRes = await generateTotpSafe(payload.secret);
  if (totpRes.isOk()) {
    return { success: true, code: totpRes.value };
  }
  return { success: false, errorKey: totpRes.error };
}

export function registerAutofillRoutes(router: MessageRouter): void {
  router
    .register(checkAutofillSuggestionRoute, handleCheckAutofillSuggestion)
    .register(checkPendingNotificationRoute, handleCheckPendingNotification)
    .register(credentialsSubmittedRoute, handleCredentialsSubmitted)
    .register(saveCredentialActionRoute, handleSaveCredentialActionRoute)
    .register(generateTotpRoute, handleGenerateTotp);
}
