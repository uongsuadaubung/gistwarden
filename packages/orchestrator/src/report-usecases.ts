import {
  fetchPwnedPasswordsRange,
  fetchXposedOrNotBreach,
} from "@gistwarden/network";
import {
  hashPasswordSHA1PrefixSuffix,
  type TranslationKey,
} from "@gistwarden/domain";

export interface PasswordBreachResult {
  count: number;
  errorKey?: TranslationKey;
}

export async function checkPasswordHIBPUseCase(
  password: string,
): Promise<PasswordBreachResult> {
  try {
    const { prefix, suffix } = await hashPasswordSHA1PrefixSuffix(password);
    const fetchRes = await fetchPwnedPasswordsRange(prefix);
    if (fetchRes.isErr()) {
      return { count: 0, errorKey: fetchRes.error };
    }

    const text = fetchRes.value;
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

export interface EmailBreachResult {
  success: boolean;
  status: "clean" | "exposed" | "rate_limited" | "error";
  breaches?: string[];
  errorKey?: TranslationKey;
}

export async function checkEmailBreachUseCase(
  email: string,
): Promise<EmailBreachResult> {
  const fetchRes = await fetchXposedOrNotBreach(email);
  if (fetchRes.isErr()) {
    return {
      success: false,
      status: "error",
      errorKey: fetchRes.error,
    };
  }

  const { status, breaches, errorKey } = fetchRes.value;
  if (status === "rate_limited") {
    return { success: false, status: "rate_limited", errorKey };
  }
  if (status === "error") {
    return { success: false, status: "error", errorKey };
  }

  return {
    success: true,
    status,
    breaches,
  };
}
