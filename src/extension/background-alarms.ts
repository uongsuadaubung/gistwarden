import {
  ALARM_NAME_VAULT_TIMEOUT,
  MSG_VAULT_LOCKED,
  MSG_VAULT_LOGGED_OUT,
  SESSION_KEY_DERIVED_KEY,
} from "@/core/constants.ts";
import { clearAlarm, createAlarm, hasAlarms, onAlarm } from "@/core/alarms.ts";
import {
  clearLocal,
  clearUnlockedSessionState,
  getAllSettings,
  getSessionItem,
  SettingsSchema,
} from "@/core/storage.ts";
import { broadcastMessage } from "@/core/messaging.ts";
import { updateExtensionBadge } from "@/extension/background-badge.ts";

export async function updateTimeoutAlarm(): Promise<void> {
  if (!hasAlarms()) return;

  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);

  const settingsRes = await getAllSettings();
  if (settingsRes.isErr()) {
    return;
  }
  const settings = settingsRes.value;
  const timeout = settings.vaultTimeout || "onRestart";

  if (timeout !== "onRestart") {
    const minutes = parseInt(timeout, 10);
    if (!isNaN(minutes) && minutes > 0) {
      const derivedKeyRes = await getSessionItem(SESSION_KEY_DERIVED_KEY);
      const derivedKey = derivedKeyRes.isOk() ? derivedKeyRes.value : null;
      if (derivedKey) {
        await createAlarm(ALARM_NAME_VAULT_TIMEOUT, {
          delayInMinutes: minutes,
        });
        console.debug(
          `[Background] Set ${ALARM_NAME_VAULT_TIMEOUT} alarm for ${minutes} minutes`,
        );
      }
    }
  }
}

export function setupAlarmsListener(): () => void {
  return onAlarm(async (alarm) => {
    if (alarm.name === ALARM_NAME_VAULT_TIMEOUT) {
      console.debug(
        `[Background] ${ALARM_NAME_VAULT_TIMEOUT} alarm fired. Locking/Logging out...`,
      );
      const settingsRes = await getAllSettings();
      const settings = settingsRes.isOk()
        ? settingsRes.value
        : SettingsSchema.parse({});
      const action = settings.vaultTimeoutAction || "lock";

      const removeRes = await clearUnlockedSessionState();
      if (removeRes.isErr()) {
        console.error(
          "[Background] Failed to clear session items:",
          removeRes.error,
        );
      }

      if (action === "logout") {
        await clearLocal();
        broadcastMessage({ type: MSG_VAULT_LOGGED_OUT });
      } else {
        broadcastMessage({ type: MSG_VAULT_LOCKED });
      }
      await updateExtensionBadge(false);
    }
  });
}
