import { setLanguage, t } from "@/core/i18n.ts";
import { getAllSettings, getSessionItem } from "@/core/storage.ts";
import { SESSION_KEY_DERIVED_KEY } from "@/core/constants.ts";

export async function updateExtensionBadge(
  isUnlocked: boolean,
): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.action) return;

  const settingsRes = await getAllSettings();
  if (settingsRes.isOk() && settingsRes.value.language) {
    setLanguage(settingsRes.value.language);
  }

  if (isUnlocked) {
    await chrome.action.setIcon({
      path: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "48": "icons/icon-48.png",
        "128": "icons/icon-128.png",
      },
    });
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: t("badge_status_unlocked") });
  } else {
    await chrome.action.setIcon({
      path: {
        "16": "icons/icon-locked-16.png",
        "32": "icons/icon-locked-32.png",
        "48": "icons/icon-locked-48.png",
        "128": "icons/icon-locked-128.png",
      },
    });
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: t("badge_status_locked") });
  }
}

export async function syncLockStateBadge(): Promise<void> {
  const keyRes = await getSessionItem(SESSION_KEY_DERIVED_KEY);
  const isUnlocked = keyRes.isOk() && !!keyRes.value;
  await updateExtensionBadge(isUnlocked);
}
