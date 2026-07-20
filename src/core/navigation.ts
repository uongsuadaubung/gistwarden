import { setStore, store } from "@/core/store.ts";
import { type VaultItem, View } from "@/core/types.ts";
import { requestReprompt } from "@/core/ui-service.ts";
import { removeSessionItem, setSessionItem } from "@/core/storage.ts";
import {
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  STORE_KEY_SELECTED_ITEM,
} from "@/core/constants.ts";

export const viewDepths: Record<View, number> = {
  [View.Login]: 0,
  [View.Vault]: 1,
  [View.Generator]: 2,
  [View.Settings]: 3,
  [View.ItemDetail]: 2,
  [View.ItemEdit]: 3,
  [View.Appearance]: 4,
  [View.About]: 4,
  [View.Troubleshooting]: 5,
  [View.Language]: 5,
  [View.VaultOptions]: 4,
  [View.Theme]: 5,
  [View.Fido2Prompt]: 5,
  [View.Welcome]: 0,
  [View.AccountSecurity]: 4,
  [View.ChangeMasterPassword]: 5,
  [View.ImportAccounts]: 5,
  [View.ExportAccounts]: 5,
};

let transitionToggle = false;

export function navigate(newView: View) {
  const oldView = store.view;
  const oldDepth = viewDepths[oldView] ?? 0;
  const newDepth = viewDepths[newView] ?? 0;
  let direction: "forward" | "backward" | "none" = "none";
  if (newDepth > oldDepth) {
    direction = "forward";
  } else if (newDepth < oldDepth) {
    direction = "backward";
  }

  // Toggle class suffix to force animation re-trigger
  transitionToggle = !transitionToggle;
  const suffix = transitionToggle ? "a" : "b";
  const transitionClass = direction === "none"
    ? ""
    : `slide-${direction}-${suffix}`;

  setStore({
    view: newView,
    transitionClass,
  });

  // Save navigation state
  const skipViews = [View.Login, View.Welcome, View.Fido2Prompt];
  if (!skipViews.includes(newView)) {
    setSessionItem(SESSION_KEY_LAST_VIEW, newView).catch(() => {});
    if (newView !== View.ItemDetail && newView !== View.ItemEdit) {
      removeSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID).catch(() => {});
    }
  }
}

export function selectItem(item: VaultItem | null) {
  setStore(STORE_KEY_SELECTED_ITEM, item);
  if (item) {
    transitionToggle = !transitionToggle;
    const suffix = transitionToggle ? "a" : "b";
    setStore({
      view: View.ItemDetail,
      transitionClass: `slide-forward-${suffix}`,
    });

    // Save navigation state
    setSessionItem(SESSION_KEY_LAST_VIEW, View.ItemDetail).catch(() => {});
    setSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID, item.id).catch(() => {});
  } else {
    removeSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID).catch(() => {});
  }
}

export async function openItem(
  item: VaultItem,
  targetView: View = View.ItemDetail,
) {
  if (item.reprompt === 1) {
    const authorized = await requestReprompt();
    if (!authorized) return;
  }
  setStore(STORE_KEY_SELECTED_ITEM, item);
  transitionToggle = !transitionToggle;
  const suffix = transitionToggle ? "a" : "b";
  setStore({
    view: targetView,
    transitionClass: `slide-forward-${suffix}`,
  });

  // Save navigation state
  const skipViews = [View.Login, View.Welcome, View.Fido2Prompt];
  if (!skipViews.includes(targetView)) {
    setSessionItem(SESSION_KEY_LAST_VIEW, targetView).catch(() => {});
    setSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID, item.id).catch(() => {});
  }
}
