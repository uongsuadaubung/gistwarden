import { updateSettings } from "@/core/storage.ts";
import { type VaultTimeoutAction } from "@/core/types.ts";
import { MSG_RESET_TIMEOUT } from "@/core/constants.ts";
import { notifyBackground } from "@/core/messaging.ts";

export async function updateSessionTimeout(
  timeout: string,
  action: VaultTimeoutAction,
): Promise<void> {
  await updateSettings({
    vaultTimeout: timeout,
    vaultTimeoutAction: action,
  });
  notifyBackground({ type: MSG_RESET_TIMEOUT });
}
