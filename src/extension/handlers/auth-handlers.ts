import type { MessageRouter } from "@/extension/message-router.ts";
import { fido2HeartbeatRoute } from "@/features/passkey/fido2-schemas.ts";
import type { SimpleSuccessResponse } from "@/features/sync/sync-schemas.ts";
import { userActivityRoute } from "@/features/vault/vault-schemas.ts";
import { updateTimeoutAlarm } from "@/extension/background-alarms.ts";
import { syncLockStateBadge } from "@/extension/background-badge.ts";
import { processPendingUnapprovedCredentials } from "@/extension/handlers/autofill-handlers.ts";

export function handleFido2Heartbeat(): SimpleSuccessResponse {
  console.debug("[Background] Heartbeat received");
  return { success: true };
}

export async function handleUserActivity(): Promise<SimpleSuccessResponse> {
  await Promise.all([
    updateTimeoutAlarm(),
    syncLockStateBadge(),
    processPendingUnapprovedCredentials(),
  ]);
  return { success: true };
}

export function registerAuthRoutes(router: MessageRouter): void {
  router
    .register(fido2HeartbeatRoute, handleFido2Heartbeat)
    .register(userActivityRoute, handleUserActivity);
}
