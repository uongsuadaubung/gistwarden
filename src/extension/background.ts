import { MessageRouter } from "@/extension/message-router.ts";
import { registerAutofillRoutes } from "@/extension/handlers/autofill-handlers.ts";
import { registerAuthRoutes } from "@/extension/handlers/auth-handlers.ts";
import { registerSyncRoutes } from "@/extension/handlers/sync-handlers.ts";
import { registerFido2Routes } from "@/extension/handlers/fido2-handlers.ts";
import {
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_SESSION_INITIALIZED,
} from "@/core/constants.ts";
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
import { decryptData, getSessionKey } from "@/core/crypto.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import {
  type VaultItem,
  VaultListSchema,
  VaultPayloadSchema,
} from "@/features/vault/vault-schemas.ts";
import { EncryptedPayloadSchema } from "@/features/sync/sync-schemas.ts";

export async function getDecryptedVaultItems(): Promise<
  {
    items: VaultItem[];
    key: CryptoKey;
    salt: string;
  } | null
> {
  const key = await getSessionKey();
  if (!key) return null;

  const rawVaultRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const rawVault = rawVaultRes.isOk() ? rawVaultRes.value : null;
  if (typeof rawVault !== "string" || !rawVault) {
    return { items: [], key, salt: "" };
  }

  const parsePayloadRes = safeJsonParse(rawVault);
  if (parsePayloadRes.isErr()) return { items: [], key, salt: "" };

  const payloadParse = EncryptedPayloadSchema.safeParse(parsePayloadRes.value);
  if (
    !payloadParse.success || !payloadParse.data.ciphertext ||
    !payloadParse.data.iv
  ) {
    return { items: [], key, salt: "" };
  }

  const { ciphertext, iv, salt } = payloadParse.data;
  const decryptRes = await decryptData(ciphertext, iv, key);
  if (decryptRes.isErr()) return { items: [], key, salt: salt || "" };

  const parseItemsRes = safeJsonParse(decryptRes.value);
  if (parseItemsRes.isErr()) return { items: [], key, salt: salt || "" };

  let items: VaultItem[] = [];
  const rawVal = parseItemsRes.value;
  if (Array.isArray(rawVal)) {
    const validateRes = VaultListSchema.safeParse(rawVal);
    if (!validateRes.success) return { items: [], key, salt: salt || "" };
    items = validateRes.data;
  } else {
    const validateRes = VaultPayloadSchema.safeParse(rawVal);
    if (!validateRes.success) return { items: [], key, salt: salt || "" };
    items = validateRes.data.items;
  }

  return { items, key, salt: salt || "" };
}

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
