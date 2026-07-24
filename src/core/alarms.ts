import { err, Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export function hasAlarms(): boolean {
  return typeof chrome !== "undefined" && !!chrome.alarms;
}

export async function createAlarm(
  name: string,
  alarmInfo: chrome.alarms.AlarmCreateInfo,
): Promise<Result<void, TranslationKey>> {
  if (!hasAlarms()) return err("storage_error");
  return await ResultAsync.fromPromise(
    chrome.alarms.create(name, alarmInfo),
    (_e): TranslationKey => "storage_error",
  );
}

export async function clearAlarm(
  name: string,
): Promise<Result<boolean, TranslationKey>> {
  if (!hasAlarms()) return err("storage_error");
  return await ResultAsync.fromPromise(
    chrome.alarms.clear(name),
    (_e): TranslationKey => "storage_error",
  );
}

export type AlarmHandler = (alarm: chrome.alarms.Alarm) => void;

/**
 * Register a listener for chrome.alarms with safety checks for non-extension environments.
 * Returns an unbind function to remove the listener.
 */
export function onAlarm(handler: AlarmHandler): () => void {
  if (!hasAlarms() || !chrome.alarms?.onAlarm) {
    return () => {};
  }

  chrome.alarms.onAlarm.addListener(handler);
  return () => {
    chrome.alarms.onAlarm.removeListener(handler);
  };
}
