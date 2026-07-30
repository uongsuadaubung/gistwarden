import {
  checkDataBreachRoute,
  checkHIBPRoute,
  sendBackgroundMessage,
} from "@gistwarden/orchestrator";
import { safeFetch } from "@gistwarden/network";
import {
  hashPasswordSHA1PrefixSuffix,
  type LoginVaultItem,
  type TranslationKey,
} from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";

export function formatVaultItemUsername(item: LoginVaultItem): string {
  return item.login?.username || t("report_no_username");
}

export async function checkPasswordHIBPUseCase(
  password: string,
): Promise<{ count: number; errorKey?: TranslationKey }> {
  if (
    typeof chrome !== "undefined" &&
    typeof chrome.runtime?.sendMessage === "function"
  ) {
    const bgRes = await sendBackgroundMessage(checkHIBPRoute, { password });
    if (bgRes.isOk()) {
      return {
        count: bgRes.value.count,
        errorKey: bgRes.value.errorKey,
      };
    }
  }

  try {
    const { prefix, suffix } = await hashPasswordSHA1PrefixSuffix(password);

    const res = await safeFetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
    );

    if (res.status === 429) {
      return { count: 0, errorKey: "report_error_rate_limit" };
    }

    if (!res.ok) return { count: 0, errorKey: "report_error_server" };
    const text = await res.text();
    const lines = text.split("\n");
    for (const line of lines) {
      const [lineSuffix, countStr] = line.trim().split(":");
      if (lineSuffix === suffix) {
        return { count: parseInt(countStr, 10) || 0 };
      }
    }
    return { count: 0 };
  } catch {
    return { count: 0, errorKey: "report_error_network" };
  }
}

export async function checkEmailBreachUseCase(email: string): Promise<{
  success: boolean;
  status: "clean" | "exposed" | "rate_limited" | "error";
  breaches?: string[];
  errorKey?: TranslationKey;
}> {
  if (
    typeof chrome !== "undefined" &&
    typeof chrome.runtime?.sendMessage === "function"
  ) {
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
  }

  try {
    const res = await safeFetch(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
    );

    if (res.status === 404) {
      return { success: true, status: "clean", breaches: [] };
    }

    if (res.status === 429) {
      return {
        success: false,
        status: "rate_limited",
        errorKey: "report_error_rate_limit",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        status: "error",
        errorKey: "report_error_server",
      };
    }

    const data: unknown = await res.json();
    if (
      data && typeof data === "object" && "status" in data &&
      data.status === "success" && "breaches" in data &&
      Array.isArray(data.breaches) && data.breaches.length > 0
    ) {
      const rawList = Array.isArray(data.breaches[0])
        ? data.breaches[0]
        : data.breaches;
      const list: string[] = rawList.map((item: unknown) => String(item));
      return { success: true, status: "exposed", breaches: list };
    }

    return { success: true, status: "clean", breaches: [] };
  } catch {
    return {
      success: false,
      status: "error",
      errorKey: "report_error_network",
    };
  }
}
