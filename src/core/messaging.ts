import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

/**
 * Send a message to the background script and wait for a response.
 * Handles API availability checks and wraps chrome.runtime.lastError.
 */
export function sendMessageToBackground(
  message: unknown,
): Promise<Result<unknown, TranslationKey>> {
  return new Promise((resolve) => {
    if (
      typeof chrome === "undefined" || !chrome.runtime ||
      !chrome.runtime.sendMessage
    ) {
      resolve(err("toast_error"));
      return;
    }

    const safeSend = Result.fromThrowable(
      (msg: unknown, cb: (res: unknown) => void) => {
        chrome.runtime.sendMessage(msg, cb);
      },
      (): TranslationKey => "toast_error",
    );

    const callResult = safeSend(message, (response: unknown) => {
      if (chrome.runtime.lastError) {
        resolve(err("toast_error"));
        return;
      }
      resolve(ok(response));
    });

    if (callResult.isErr()) {
      resolve(err(callResult.error));
    }
  });
}

/**
 * Send a message to the background script in a fire-and-forget manner.
 * Use this for signals that do not require a response (e.g., MSG_RESET_TIMEOUT).
 */
export function notifyBackground(
  message: unknown,
): Result<void, TranslationKey> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("toast_error");
  }

  const safeSend = Result.fromThrowable(
    (msg: unknown) => {
      chrome.runtime.sendMessage(msg).catch(() => {});
    },
    (): TranslationKey => "toast_error",
  );

  return safeSend(message);
}

/**
 * Broadcast a message from the background script to all other parts of the extension.
 * This is effectively the same API as notifyBackground, but named differently
 * to express the intent of the caller (background broadcasting state changes).
 */
export function broadcastMessage(
  message: unknown,
): Result<void, TranslationKey> {
  if (
    typeof chrome === "undefined" || !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    return err("toast_error");
  }

  const safeSend = Result.fromThrowable(
    (msg: unknown) => {
      chrome.runtime.sendMessage(msg).catch(() => {});
    },
    (): TranslationKey => "toast_error",
  );

  return safeSend(message);
}
