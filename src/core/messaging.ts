import { err, ok, Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

/**
 * Send a message to the background script and wait for a response.
 * Handles API availability checks and wraps chrome.runtime.lastError.
 */
export async function sendMessageToBackground(
  message: unknown,
): Promise<Result<unknown, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("toast_error");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.runtime.sendMessage(message),
    (): TranslationKey => "toast_error",
  );
  if (sendRes.isErr()) return err(sendRes.error);
  return ok(sendRes.value);
}

/**
 * Send a message to the background script in a fire-and-forget manner.
 * Use this for signals that do not require a response (e.g., MSG_RESET_TIMEOUT).
 */
export async function notifyBackground(
  message: unknown,
): Promise<Result<void, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("toast_error");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.runtime.sendMessage(message),
    (): TranslationKey => "toast_error",
  );
  if (sendRes.isErr()) return err(sendRes.error);
  return ok(undefined);
}

/**
 * Broadcast a message from the background script to all other parts of the extension.
 * This is effectively the same API as notifyBackground, but named differently
 * to express the intent of the caller (background broadcasting state changes).
 */
export async function broadcastMessage(
  message: unknown,
): Promise<Result<void, TranslationKey>> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("toast_error");
  }

  const sendRes = await ResultAsync.fromPromise(
    chrome.runtime.sendMessage(message),
    (): TranslationKey => "toast_error",
  );
  if (sendRes.isErr()) return err(sendRes.error);
  return ok(undefined);
}
