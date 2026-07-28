import { setUiStore } from "@/core/store.ts";
import {
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  STORE_KEY_SELECTED_ITEM,
  View,
} from "@gistwarden/domain";
import type { VaultItem } from "@gistwarden/domain";
import { requestReprompt } from "./ui-service.ts";
import { removeSessionItem, setSessionItem } from "@gistwarden/repository";
import { getPathView, getViewPath } from "@/core/router.ts";

export { pathDepths as viewDepths } from "@/core/router.ts";

type NavigatorFn = (to: string, options?: { replace?: boolean }) => void;

export class NavigationManager {
  private activeNavigator: NavigatorFn | null = null;

  public setNavigator(navigator: NavigatorFn): void {
    this.activeNavigator = navigator;
  }

  public getNavigator(): NavigatorFn | null {
    return this.activeNavigator;
  }

  public navigate(newPath: string): void {
    if (this.activeNavigator) {
      this.activeNavigator(newPath);
    }
  }
}

export const navigationManager = new NavigationManager();

export function setActiveNavigator(navigator: NavigatorFn): void {
  navigationManager.setNavigator(navigator);
}

export function navigatePath(newPath: string): void {
  const targetView = getPathView(newPath);
  setUiStore("view", targetView);

  navigationManager.navigate(newPath);

  const skipViews = [View.Login, View.Welcome, View.Fido2Prompt];
  if (!skipViews.includes(targetView)) {
    setSessionItem(SESSION_KEY_LAST_VIEW, targetView);
    if (targetView !== View.ItemDetail && targetView !== View.ItemEdit) {
      removeSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID);
    }
  }
}

export function navigate(newView: View): void {
  const targetPath = getViewPath(newView);
  navigatePath(targetPath);
}

export function selectItem(item: VaultItem | null): void {
  setUiStore(STORE_KEY_SELECTED_ITEM, item);
  if (item) {
    navigatePath("/vault/detail");
    setSessionItem(SESSION_KEY_LAST_VIEW, View.ItemDetail);
    setSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID, item.id);
  } else {
    removeSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID);
  }
}

export async function openItem(
  item: VaultItem,
  targetView: View = View.ItemDetail,
): Promise<void> {
  if (item.reprompt === 1) {
    const authorized = await requestReprompt();
    if (!authorized) return;
  }
  setUiStore(STORE_KEY_SELECTED_ITEM, item);
  const targetPath = getViewPath(targetView);
  navigatePath(targetPath);

  const skipViews = [View.Login, View.Welcome, View.Fido2Prompt];
  if (!skipViews.includes(targetView)) {
    setSessionItem(SESSION_KEY_LAST_VIEW, targetView);
    setSessionItem(SESSION_KEY_LAST_SELECTED_ITEM_ID, item.id);
  }
}
