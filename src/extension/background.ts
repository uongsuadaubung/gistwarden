import { MessageRouter } from "@/extension/message-router.ts";
import { registerAutofillRoutes } from "@/extension/handlers/autofill-handlers.ts";
import { registerAuthRoutes } from "@/extension/handlers/auth-handlers.ts";
import { registerSyncRoutes } from "@/extension/handlers/sync-handlers.ts";
import { registerFido2Routes } from "@/extension/handlers/fido2-handlers.ts";
import { SESSION_KEY_SESSION_INITIALIZED } from "@/core/constants.ts";
import {
  clearSession,
  configureSessionAccessLevel,
  getExtensionSettings,
  getSessionItem,
  hasSessionStorage,
  resetAccountSettings,
  setSessionItem,
} from "@/core/storage.ts";
import { ExtensionSettingsSchema } from "@/core/storage-schemas.ts";
import { syncLockStateBadge } from "@/extension/background-badge.ts";
import { setupAlarmsListener } from "@/extension/background-alarms.ts";
import { setupIdleListener } from "@/extension/background-idle.ts";

new MessageRouter()
  .use(registerAutofillRoutes)
  .use(registerAuthRoutes)
  .use(registerSyncRoutes)
  .use(registerFido2Routes)
  .listen();

// Listener Management
setupAlarmsListener();
setupIdleListener();

// Khởi tạo phiên làm việc và xử lý đăng xuất khi khởi động lại trình duyệt
async function initSession() {
  if (!hasSessionStorage()) {
    await syncLockStateBadge();
    return;
  }
  await configureSessionAccessLevel();
  const sessionInitializedRes = await getSessionItem(
    SESSION_KEY_SESSION_INITIALIZED,
  );
  const sessionInitialized = sessionInitializedRes.isOk()
    ? sessionInitializedRes.value
    : null;

  if (!sessionInitialized) {
    const settingsRes = await getExtensionSettings();
    const settings = settingsRes.isOk()
      ? settingsRes.value
      : ExtensionSettingsSchema.parse({});
    const action = settings.vaultTimeoutAction || "lock";
    if (action === "logout") {
      console.debug(
        "[Background] Trình duyệt khởi động lại và vaultTimeoutAction là logout. Đang đăng xuất...",
      );
      await resetAccountSettings();
      await clearSession();
    }
    await setSessionItem(SESSION_KEY_SESSION_INITIALIZED, true);
  }

  await syncLockStateBadge();
}

initSession();
