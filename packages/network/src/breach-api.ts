import { safeFetch } from "./fetch-utils.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@gistwarden/domain";

export async function fetchPwnedPasswordsRange(
  prefix: string,
): Promise<Result<string, TranslationKey>> {
  try {
    const res = await safeFetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
    );
    if (res.status === 429) {
      return err("report_error_rate_limit");
    }
    if (!res.ok) {
      return err("report_error_server");
    }
    const text = await res.text();
    return ok(text);
  } catch {
    return err("report_error_network");
  }
}

export type BreachFetchStatus = "clean" | "exposed" | "rate_limited" | "error";

export interface BreachFetchResult {
  status: BreachFetchStatus;
  breaches: string[];
  errorKey?: TranslationKey;
}

export async function fetchXposedOrNotBreach(
  email: string,
): Promise<Result<BreachFetchResult, TranslationKey>> {
  try {
    const res = await safeFetch(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
    );
    if (res.status === 404) {
      return ok({ status: "clean", breaches: [] });
    }
    if (res.status === 429) {
      return ok({
        status: "rate_limited",
        breaches: [],
        errorKey: "report_error_rate_limit",
      });
    }
    if (!res.ok) {
      return ok({
        status: "error",
        breaches: [],
        errorKey: "report_error_server",
      });
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
      return ok({ status: "exposed", breaches: list });
    }
    return ok({ status: "clean", breaches: [] });
  } catch {
    return ok({
      status: "error",
      breaches: [],
      errorKey: "report_error_network",
    });
  }
}
