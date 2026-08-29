import {
  isLoginItem,
  type LoginVaultItem,
  type TranslationKey,
  type VaultItem,
} from "@gistwarden/domain";
import {
  checkDataBreachRoute,
  checkHIBPRoute,
  sendBackgroundMessage,
} from "@gistwarden/orchestrator";
import { t } from "@/core/i18n.ts";
import { updateItem } from "@/features/vault/vault-service.ts";

export function getUnsecureLoginItems(
  vaultItems?: VaultItem[] | null,
): LoginVaultItem[] {
  const items = (vaultItems || []).filter(isLoginItem);
  return items.filter((item) => {
    const uris = item.login?.uris || [];
    return uris.some((u) => u.uri?.trim().toLowerCase().startsWith("http://"));
  });
}

export async function upgradeLoginItemToHttps(
  item: LoginVaultItem,
): Promise<void> {
  if (!item.login?.uris) return;

  const updatedUris = item.login.uris.map((u) => {
    if (u.uri?.trim().toLowerCase().startsWith("http://")) {
      return {
        ...u,
        uri: u.uri.replace(/^http:\/\//i, "https://"),
      };
    }
    return u;
  });

  const updatedItem: LoginVaultItem = {
    ...item,
    revisionDate: new Date().toISOString(),
    login: {
      ...item.login,
      uris: updatedUris,
    },
  };

  await updateItem(item.id, updatedItem);
}

export function formatVaultItemUsername(item: LoginVaultItem): string {
  return item.login?.username || t("report_no_username");
}

export async function checkPasswordHIBP(
  password: string,
): Promise<{ count: number; errorKey?: TranslationKey }> {
  const bgRes = await sendBackgroundMessage(checkHIBPRoute, { password });
  if (bgRes.isOk()) {
    return {
      count: bgRes.value.count,
      errorKey: bgRes.value.errorKey,
    };
  }
  return { count: 0, errorKey: bgRes.error };
}

export async function checkEmailBreach(email: string): Promise<{
  success: boolean;
  status: "clean" | "exposed" | "rate_limited" | "error";
  breaches?: string[];
  errorKey?: TranslationKey;
}> {
  const bgRes = await sendBackgroundMessage(checkDataBreachRoute, { email });
  if (bgRes.isOk()) {
    const val = bgRes.value;
    return {
      success: val.success,
      status: val.status,
      breaches: val.breaches,
      errorKey: val.errorKey,
    };
  }
  return {
    success: false,
    status: "error",
    errorKey: bgRes.error,
  };
}
