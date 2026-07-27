import { z } from "zod";
import type { MessageRouter } from "@/extension/message-router.ts";
import {
  type Fido2ActionResponse,
  fido2CredentialCreationRoute,
  fido2CredentialGetRoute,
  type Fido2PromptResponse,
  Fido2PromptResponseSchema,
  GetPendingFido2RequestResponseSchema,
  getPendingFido2RequestRoute,
  type RejectFido2RequestMsg,
  rejectFido2RequestRoute,
  type ResolveFido2RequestMsg,
  resolveFido2RequestRoute,
} from "@/features/passkey/fido2-schemas.ts";
import {
  FIDO2_PROMPT_HEIGHT,
  POPUP_WIDTH,
  SESSION_KEY_PENDING_FIDO2_REQUEST,
} from "@/core/constants.ts";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "@/core/storage.ts";
import { pendingNotificationManager } from "@/extension/pending-notification-manager.ts";
import { getAssetUrl } from "@/core/runtime.ts";
import type { MessageContext } from "@/extension/message-router.ts";

const PendingFido2RequestSchema = z.object({
  type: z.enum(["create", "get"]),
  options: GetPendingFido2RequestResponseSchema.shape.options,
  origin: z.string(),
  senderTabId: z.number(),
});

async function handleFido2CredentialRequestInternal(
  reqType: "create" | "get",
  data: unknown,
  context: MessageContext,
): Promise<Fido2PromptResponse> {
  if (!context.sender.tab || context.sender.tab.id === undefined) {
    return { success: false, error: "No sender tab" };
  }

  await pendingNotificationManager.clearFido2Result();

  const requestData = {
    type: reqType,
    options: data,
    origin: context.sender.origin ||
      new URL(context.sender.tab.url || "").origin,
    senderTabId: context.sender.tab.id,
  };

  await setSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST, requestData);

  return new Promise<Fido2PromptResponse>((resolve) => {
    pendingNotificationManager.setFido2Callback((rawRes: unknown) => {
      const parsed = Fido2PromptResponseSchema.safeParse(rawRes);
      if (parsed.success) {
        resolve(parsed.data);
      } else {
        resolve({
          success: false,
          error: "Invalid response from FIDO2 prompt",
        });
      }
    });

    chrome.windows.create({
      url: getAssetUrl("popup.html?mode=fido2-prompt"),
      type: "popup",
      width: POPUP_WIDTH,
      height: FIDO2_PROMPT_HEIGHT,
      focused: true,
    });
  });
}

export async function handleFido2CredentialCreationRequest(
  payload: { data?: unknown },
  context: MessageContext,
): Promise<Fido2PromptResponse> {
  return await handleFido2CredentialRequestInternal(
    "create",
    payload.data,
    context,
  );
}

export async function handleFido2CredentialGetRequest(
  payload: { data?: unknown },
  context: MessageContext,
): Promise<Fido2PromptResponse> {
  return await handleFido2CredentialRequestInternal(
    "get",
    payload.data,
    context,
  );
}

export async function handleGetPendingFido2Request(): Promise<
  z.infer<typeof GetPendingFido2RequestResponseSchema>
> {
  const savedRes = await getSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST);
  const saved = savedRes.isOk() ? savedRes.value : null;
  const parsed = PendingFido2RequestSchema.safeParse(saved);
  if (parsed.success) {
    return {
      success: true,
      type: parsed.data.type,
      options: parsed.data.options,
      origin: parsed.data.origin,
    };
  }
  return { success: false, error: "No pending request" };
}

export async function handleResolveFido2Request(
  payload: ResolveFido2RequestMsg,
): Promise<Fido2ActionResponse> {
  await removeSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST);

  if (
    pendingNotificationManager.resolveFido2Callback({
      success: true,
      result: payload.result,
    })
  ) {
    return { success: true };
  }
  return {
    success: false,
    error: "No pending request callback found in memory",
  };
}

export async function handleRejectFido2Request(
  payload: RejectFido2RequestMsg,
): Promise<Fido2ActionResponse> {
  await removeSessionItem(SESSION_KEY_PENDING_FIDO2_REQUEST);

  if (
    pendingNotificationManager.resolveFido2Callback({
      success: false,
      error: payload.error || "User cancelled",
    })
  ) {
    return { success: true };
  }
  return {
    success: false,
    error: "No pending request callback found in memory",
  };
}

export function registerFido2Routes(router: MessageRouter): void {
  router
    .register(
      fido2CredentialCreationRoute,
      handleFido2CredentialCreationRequest,
    )
    .register(fido2CredentialGetRoute, handleFido2CredentialGetRequest)
    .register(getPendingFido2RequestRoute, handleGetPendingFido2Request)
    .register(resolveFido2RequestRoute, handleResolveFido2Request)
    .register(rejectFido2RequestRoute, handleRejectFido2Request);
}
