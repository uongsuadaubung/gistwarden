import { setSettingsStore, setUiStore, uiStore } from "@/core/store.ts";
import { err, ok, Result } from "neverthrow";
import { z } from "zod";
import { type ConfirmType, type ToastType } from "@/core/storage-schemas.ts";
import {
  setLanguage,
  SupportLanguage,
  t,
  type TranslationKey,
} from "@/core/i18n.ts";
import { setLocalItem, updateExtensionSettings } from "@/core/storage.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { fetchText } from "@/core/fetch-utils.ts";
import { writeClipboardText } from "@/core/clipboard-utils.ts";
import {
  LOCAL_STORAGE_KEY_THEME,
  OAUTH_WORKER_URL,
  STORE_KEY_CONFIRM_MODAL,
  STORE_KEY_GLOBAL_LOADING,
  STORE_KEY_GLOBAL_LOADING_TEXT,
  STORE_KEY_REPROMPT_MODAL,
  STORE_KEY_TOAST_MESSAGE,
  STORE_KEY_TOAST_TYPE,
} from "@/core/constants.ts";

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, type: ToastType = "success") {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
  setUiStore({
    [STORE_KEY_TOAST_MESSAGE]: message,
    [STORE_KEY_TOAST_TYPE]: type,
  });
  toastTimeoutId = setTimeout(() => {
    setUiStore(STORE_KEY_TOAST_MESSAGE, "");
  }, 2000);
}

export async function copyToClipboardWithMessage(
  text: string,
  successMessageKey: TranslationKey = "detail_copied",
) {
  if (!text) return;
  const copyRes = await writeClipboardText(text);

  if (copyRes.isErr()) {
    showToast(t(copyRes.error), "error");
    return;
  }

  showToast(t(successMessageKey), "success");
}

export function setGlobalLoading(val: boolean, text = "") {
  setUiStore({
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
    setUiStore(STORE_KEY_CONFIRM_MODAL, {
      isOpen: true,
      title,
      message,
      type,
      resolve,
    });
  });
}

export function resolveConfirm(result: boolean) {
  const modal = uiStore.confirmModal;
  if (modal.resolve) {
    modal.resolve(result);
  }
  setUiStore(STORE_KEY_CONFIRM_MODAL, {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    resolve: null,
  });
}

export function requestReprompt(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setUiStore(STORE_KEY_REPROMPT_MODAL, {
      isOpen: true,
      resolve,
    });
  });
}

export function resolveReprompt(success: boolean) {
  const modal = uiStore.repromptModal;
  if (modal.resolve) {
    modal.resolve(success);
  }
  setUiStore(STORE_KEY_REPROMPT_MODAL, {
    isOpen: false,
    resolve: null,
  });
}

export async function updateLanguage(lang: "en" | "vi") {
  setSettingsStore("language", lang);
  setLanguage(lang === "vi" ? SupportLanguage.Vi : SupportLanguage.En);
  await updateExtensionSettings({ language: lang });
}

export async function updateTheme(newTheme: "dark" | "light") {
  setSettingsStore("theme", newTheme);
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
    return err("settings_sync_time_error");
  }
  const data = jsonRes.value;

  const parseResult = TimeServerResponseSchema.safeParse(data);
  if (parseResult.success) {
    const serverTime = parseResult.data.unixtime * 1000;
    const localTime = Date.now();
    const offset = serverTime - localTime;
    console.log(`[Store] Time sync successful. Offset: ${offset}ms`);
    setSettingsStore("timeOffset", offset);
    const updateRes = await updateExtensionSettings({ timeOffset: offset });
    if (updateRes.isErr()) {
      return err("storage_error");
    }
    return ok();
  }

  return err("settings_sync_time_error");
}
