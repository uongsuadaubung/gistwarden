import {
  isExtension,
  isRecord,
  logger,
  type TranslationKey,
} from "@gistwarden/domain";
import { err, ok, type Result } from "neverthrow";
import type { z } from "zod";

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
) => boolean | undefined | void | Promise<void>;

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
export type InMemoryRouteHandler = (
  payload: unknown,
) => Promise<unknown> | unknown;

const inMemoryRouteHandlers = new Map<string, InMemoryRouteHandler>();

/**
 * Register an in-memory handler for a specific route type (used in Web environment without chrome.runtime).
 */
export function registerInMemoryRoute<
  TType extends string,
  TPayloadSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
>(
  route: RouteContract<TType, TPayloadSchema, TResponseSchema>,
  handler: (
    payload: z.infer<TPayloadSchema>,
  ) => Promise<z.infer<TResponseSchema>> | z.infer<TResponseSchema>,
): void {
  const wrappedHandler: InMemoryRouteHandler = (rawPayload: unknown) => {
    const payloadResult = route.payloadSchema.safeParse(rawPayload);
    if (!payloadResult.success) {
      return { success: false, error: "Invalid in-memory message payload" };
    }
    return handler(payloadResult.data);
  };
  inMemoryRouteHandlers.set(route.type, wrappedHandler);
}

/**
 * Send a strongly-typed message to the background script using a RouteContract.
 * In a non-extension environment (Web), automatically routes to registered in-memory handlers.
 */
export async function sendBackgroundMessage<
  TType extends string,
  TPayloadSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
>(
  route: RouteContract<TType, TPayloadSchema, TResponseSchema>,
  payload?: Omit<z.infer<TPayloadSchema>, "type">,
): Promise<Result<z.infer<TResponseSchema>, TranslationKey>> {
  const message = { type: route.type, ...(payload || {}) };
  let responseVal: unknown;

  if (isExtension() && typeof chrome.runtime.sendMessage === "function") {
    try {
      responseVal = await chrome.runtime.sendMessage(message);
    } catch (e) {
      logger.messaging.error(
        `Failed to send message for route ${route.type}:`,
        e,
      );
      return err("messaging_error_send_failed");
    }
  } else {
    const localHandler = inMemoryRouteHandlers.get(route.type);
    if (!localHandler) {
      logger.messaging.warn(
        `No in-memory handler registered for route ${route.type} in non-extension environment`,
      );
      return err("messaging_error_send_failed");
    }
    try {
      responseVal = await localHandler(message);
    } catch (e) {
      logger.messaging.error(
        `In-memory execution failed for route ${route.type}:`,
        e,
      );
      return err("messaging_error_send_failed");
    }
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
  if (isExtension() && typeof chrome.runtime.sendMessage === "function") {
    try {
      await chrome.runtime.sendMessage(message);
      return ok();
    } catch (e) {
      logger.messaging.error("Failed to notify background script:", e);
      return err("messaging_error_send_failed");
    }
  }

  if (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    typeof message.type === "string"
  ) {
    const localHandler = inMemoryRouteHandlers.get(message.type);
    if (localHandler) {
      try {
        await localHandler(message);
        return ok();
      } catch (e) {
        logger.messaging.error(
          `In-memory notify failed for route ${message.type}:`,
          e,
        );
        return err("messaging_error_send_failed");
      }
    }
  }

  return ok();
}

/**
 * Broadcast a runtime message to all internal extension views (e.g. Popup, Options).
 */
export async function broadcastMessage(
  message: unknown,
): Promise<Result<void, TranslationKey>> {
  return await notifyBackground(message);
}

export async function sendMessageToTab(
  tabId: number,
  message: unknown,
): Promise<Result<unknown, TranslationKey>> {
  if (
    typeof chrome === "undefined" ||
    !chrome.tabs ||
    !chrome.tabs.sendMessage
  ) {
    return err("tab_error_send_message");
  }

  try {
    const res = await chrome.tabs.sendMessage(tabId, message);
    return ok(res);
  } catch (e) {
    logger.messaging.warn("Failed to send message to tab:", e);
    return err("tab_error_send_message");
  }
}

export async function handleInMemoryMessage(
  message: unknown,
): Promise<unknown> {
  if (isRecord(message) && typeof message.type === "string") {
    const route = inMemoryRouteHandlers.get(message.type);
    if (route) {
      return await route(message);
    }
  }
  return { success: false, error: "messaging_error_send_failed" };
}
