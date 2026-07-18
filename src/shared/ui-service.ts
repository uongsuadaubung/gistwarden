import { setStore, store } from "./store.ts";
import { type ConfirmType, type ToastType } from "./types.ts";
import { setLanguage, SupportLanguage } from "./i18n.ts";
import { updateSettings } from "./storage.ts";
import { APP_NAME, OAUTH_WORKER_URL } from "./constants.ts";

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, type: ToastType = "success") {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
  setStore({ toastMessage: message, toastType: type });
  toastTimeoutId = setTimeout(() => {
    setStore("toastMessage", "");
  }, 2000);
}

export function setGlobalLoading(val: boolean, text = "") {
  setStore({ globalLoading: val, globalLoadingText: text });
}

export function confirm(
  title: string,
  message: string,
  type: ConfirmType = "info",
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setStore("confirmModal", {
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
  setStore("confirmModal", {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    resolve: null,
  });
}

export function requestReprompt(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setStore("repromptModal", {
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
  setStore("repromptModal", {
    isOpen: false,
    resolve: null,
  });
}

export async function updateLanguage(lang: "en" | "vi") {
  setStore("language", lang);
  setLanguage(lang === "vi" ? SupportLanguage.Vi : SupportLanguage.En);
  await updateSettings({ language: lang });
}

export async function updateTheme(newTheme: "dark" | "light") {
  setStore("theme", newTheme);
  if (newTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
  if (typeof chrome !== "undefined" && chrome.storage) {
    await chrome.storage.local.set({
      [`${APP_NAME.toLowerCase()}_theme`]: newTheme,
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
        setStore("timeOffset", offset);
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
