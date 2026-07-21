import { setStore, store } from "@/core/store.ts";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { z } from "zod";
import { type ConfirmType, type ToastType } from "@/core/types.ts";
import {
  setLanguage,
  SupportLanguage,
  t,
  type TranslationKey,
} from "@/core/i18n.ts";
import { setLocalItem, updateSettings } from "@/core/storage.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { fetchText } from "@/core/fetch-utils.ts";
import {
  LOCAL_STORAGE_KEY_THEME,
  OAUTH_WORKER_URL,
  STORE_KEY_CONFIRM_MODAL,
  STORE_KEY_GLOBAL_LOADING,
  STORE_KEY_GLOBAL_LOADING_TEXT,
  STORE_KEY_LANGUAGE,
  STORE_KEY_REPROMPT_MODAL,
  STORE_KEY_THEME,
  STORE_KEY_TIME_OFFSET,
  STORE_KEY_TOAST_MESSAGE,
  STORE_KEY_TOAST_TYPE,
} from "@/core/constants.ts";

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, type: ToastType = "success") {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
  setStore({
    [STORE_KEY_TOAST_MESSAGE]: message,
    [STORE_KEY_TOAST_TYPE]: type,
  });
  toastTimeoutId = setTimeout(() => {
    setStore(STORE_KEY_TOAST_MESSAGE, "");
  }, 2000);
}

export async function copyToClipboardWithMessage(
  text: string,
  successMessageKey: TranslationKey = "detail_copied",
) {
  if (!text) return;
  const copyRes = await ResultAsync.fromPromise(
    navigator.clipboard.writeText(text),
    (e) => e,
  );

  if (copyRes.isErr()) {
    console.error("Failed to copy to clipboard", copyRes.error);
    showToast(t("toast_error"), "error");
    return;
  }
  
  showToast(t(successMessageKey), "success");
}

export function setGlobalLoading(val: boolean, text = "") {
  setStore({
    [STORE_KEY_GLOBAL_LOADING]: val,
    [STORE_KEY_GLOBAL_LOADING_TEXT]: text,
  });
}

export function confirm(
  title: string,
  message: string,
  type: ConfirmType = "info",
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setStore(STORE_KEY_CONFIRM_MODAL, {
      isOpen: true,
      title,
      message,
      type,
      resolve,
    });
  });
}

export function resolveConfirm(result: boolean) {
  const modal = store.confirmModal;
  if (modal.resolve) {
    modal.resolve(result);
  }
  setStore(STORE_KEY_CONFIRM_MODAL, {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    resolve: null,
  });
}

export function requestReprompt(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setStore(STORE_KEY_REPROMPT_MODAL, {
      isOpen: true,
      resolve,
    });
  });
}

export function resolveReprompt(success: boolean) {
  const modal = store.repromptModal;
  if (modal.resolve) {
    modal.resolve(success);
  }
  setStore(STORE_KEY_REPROMPT_MODAL, {
    isOpen: false,
    resolve: null,
  });
}

export async function updateLanguage(lang: "en" | "vi") {
  setStore(STORE_KEY_LANGUAGE, lang);
  setLanguage(lang === "vi" ? SupportLanguage.Vi : SupportLanguage.En);
  await updateSettings({ language: lang });
}

export async function updateTheme(newTheme: "dark" | "light") {
  setStore(STORE_KEY_THEME, newTheme);
  if (newTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
  await setLocalItem(LOCAL_STORAGE_KEY_THEME, newTheme);
}

const TimeServerResponseSchema = z.object({
  unixtime: z.number(),
});

export async function syncTimeOffset(): Promise<Result<void, TranslationKey>> {
  const textRes = await fetchText(`${OAUTH_WORKER_URL}/time`);
  if (textRes.isErr()) {
    return err(textRes.error);
  }

  const jsonRes = safeJsonParse(textRes.value);
  if (jsonRes.isErr()) {
    return err("toast_error");
  }
  const data = jsonRes.value;

  const parseResult = TimeServerResponseSchema.safeParse(data);
  if (parseResult.success) {
    const serverTime = parseResult.data.unixtime * 1000;
    const localTime = Date.now();
    const offset = serverTime - localTime;
    console.log(`[Store] Time sync successful. Offset: ${offset}ms`);
    setStore(STORE_KEY_TIME_OFFSET, offset);
    const updateRes = await updateSettings({ timeOffset: offset });
    if (updateRes.isErr()) {
      return err("storage_error");
    }
    return ok();
  }

  return err("toast_error");
}
