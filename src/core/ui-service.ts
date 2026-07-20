import { setStore, store } from "@/core/store.ts";
import { type ConfirmType, type ToastType } from "@/core/types.ts";
import { setLanguage, SupportLanguage } from "@/core/i18n.ts";
import { updateSettings } from "@/core/storage.ts";
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
  if (typeof chrome !== "undefined" && chrome.storage) {
    await chrome.storage.local.set({
      [LOCAL_STORAGE_KEY_THEME]: newTheme,
    });
  }
}

export async function syncTimeOffset(): Promise<
  { success: boolean; error?: string }
> {
  try {
    const res = await fetch(`${OAUTH_WORKER_URL}/time`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.unixtime === "number") {
        const serverTime = data.unixtime * 1000;
        const localTime = Date.now();
        const offset = serverTime - localTime;
        console.log(`[Store] Time sync successful. Offset: ${offset}ms`);
        setStore(STORE_KEY_TIME_OFFSET, offset);
        await updateSettings({ timeOffset: offset });
        return { success: true };
      }
    }
    return {
      success: false,
      error: "Không thể đọc dữ liệu thời gian từ phản hồi",
    };
  } catch (err) {
    console.warn("[Store] Failed to sync time offset:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errMsg };
  }
}
