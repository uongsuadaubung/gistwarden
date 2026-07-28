import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@gistwarden/domain";

export function hasAlarms(): boolean {
  return typeof chrome !== "undefined" && !!chrome.alarms;
}

export async function createAlarm(
  name: string,
  alarmInfo: chrome.alarms.AlarmCreateInfo,
): Promise<Result<void, TranslationKey>> {
  if (!hasAlarms()) return err("storage_error");
  try {
    await chrome.alarms.create(name, alarmInfo);
    return ok();
  } catch (e) {
    console.error(`[Alarms] Failed to create alarm '${name}':`, e);
    return err("storage_error");
  }
}

export async function clearAlarm(
  name: string,
): Promise<Result<boolean, TranslationKey>> {
  if (!hasAlarms()) return err("storage_error");
  try {
    const cleared = await chrome.alarms.clear(name);
    return ok(cleared);
  } catch (e) {
    console.error(`[Alarms] Failed to clear alarm '${name}':`, e);
    return err("storage_error");
  }
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
