import { onIdleStateChanged } from "@/core/idle.ts";
import {
  clearUnlockedSessionState,
  getExtensionSettings,
  resetAccountSettings,
} from "@/core/storage.ts";
import { ExtensionSettingsSchema } from "@/core/storage-schemas.ts";
import { broadcastMessage } from "@/core/messaging.ts";
import { MSG_VAULT_LOCKED, MSG_VAULT_LOGGED_OUT } from "@/core/constants.ts";
import { updateExtensionBadge } from "@/extension/background-badge.ts";

export function setupIdleListener(): () => void {
  return onIdleStateChanged(async (newState) => {
    if (newState === "locked") {
      console.debug(
        `[Background Idle] System locked. Checking vault timeout setting...`,
      );
      const settingsRes = await getExtensionSettings();
      const settings = settingsRes.isOk()
        ? settingsRes.value
        : ExtensionSettingsSchema.parse({});

      if (settings.vaultTimeout === "onSystemLock") {
        console.debug(
          `[Background Idle] Vault timeout is onSystemLock. Executing ${
            settings.vaultTimeoutAction || "lock"
          } action...`,
        );
        const action = settings.vaultTimeoutAction;

        const removeRes = await clearUnlockedSessionState();
        if (removeRes.isErr()) {
          console.error(
            "[Background Idle] Failed to clear session items:",
            removeRes.error,
          );
        }

        if (action === "logout") {
          await resetAccountSettings();
          broadcastMessage({ type: MSG_VAULT_LOGGED_OUT });
        } else {
          broadcastMessage({ type: MSG_VAULT_LOCKED });
        }
        await updateExtensionBadge(false);
      }
    }
  });
}
