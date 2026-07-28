import { z } from "zod";
import { err, ok, Result } from "neverthrow";
import { logger, type TranslationKey } from "@gistwarden/domain";

export interface RouteContract<
  TType extends string,
  TPayloadSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
> {
  type: TType;
  payloadSchema: TPayloadSchema;
  responseSchema: TResponseSchema;
  internalOnly?: boolean;
}

/**
 * Define a type-safe IPC route contract in a single place.
 */
export function defineRoute<
  TType extends string,
  TPayloadSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
>(config: {
  type: TType;
  payloadSchema: TPayloadSchema;
  responseSchema: TResponseSchema;
  internalOnly?: boolean;
}): RouteContract<TType, TPayloadSchema, TResponseSchema> {
  return config;
}

export type ExtensionMessageHandler = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

/**
 * Register a listener for extension runtime messages with safety checks for non-extension environments.
 * Returns an unbind function to remove the listener.
 */
export function onExtensionMessage(
  handler: ExtensionMessageHandler,
): () => void {
  if (
    typeof chrome === "undefined" ||
    !chrome.runtime ||
    !chrome.runtime.onMessage
  ) {
    return () => {};
  }

  chrome.runtime.onMessage.addListener(handler);
  return () => {
    chrome.runtime.onMessage.removeListener(handler);
  };
}

/**
 * Send a strongly-typed message to the background script using a RouteContract.
 */
export async function sendBackgroundMessage<
  TType extends string,
  TPayloadSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
>(
  route: RouteContract<TType, TPayloadSchema, TResponseSchema>,
  payload?: Omit<z.infer<TPayloadSchema>, "type">,
): Promise<Result<z.infer<TResponseSchema>, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("messaging_error_send_failed");
  }

  const message = { type: route.type, ...(payload || {}) };
  let responseVal: unknown;
  try {
    responseVal = await chrome.runtime.sendMessage(message);
  } catch (e) {
    logger.messaging.error(
      `Failed to send message for route ${route.type}:`,
      e,
    );
    return err("messaging_error_send_failed");
  }

  const parseRes = route.responseSchema.safeParse(responseVal);
  if (!parseRes.success) {
    logger.messaging.warn(
      `Schema validation failed for response of route ${route.type}:`,
      parseRes.error,
    );
    return err("messaging_error_send_failed");
  }

  return ok(parseRes.data);
}

/**
 * Send a message to the background script in a fire-and-forget manner.
 */
export async function notifyBackground(
  message: unknown,
): Promise<Result<void, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("messaging_error_send_failed");
  }

  try {
    await chrome.runtime.sendMessage(message);
    return ok();
  } catch (e) {
    logger.messaging.error("Failed to notify background script:", e);
    return err("messaging_error_send_failed");
  }
}

/**
 * Broadcast a runtime message to all internal extension views (e.g. Popup, Options).
 */
export async function broadcastMessage(
  message: unknown,
): Promise<Result<void, TranslationKey>> {
  return await notifyBackground(message);
}
