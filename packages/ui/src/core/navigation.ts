import type { VaultItem } from "@gistwarden/domain";
import {
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  STORE_KEY_SELECTED_ITEM,
  View,
} from "@gistwarden/domain";
import {
  removeSessionStorageUseCase,
  setSessionStorageUseCase,
} from "@gistwarden/orchestrator";
import {
  getParentView,
  getPathView,
  getViewHash,
  getViewPath,
  normalizeHashRoute,
} from "@/core/router.ts";
import { setUiStore, uiStore } from "@/core/store.ts";
import { requestReprompt } from "./ui-service.ts";

type NavigatorFn = (to: string, options?: { replace?: boolean }) => void;

export class NavigationManager {
  private activeNavigator: NavigatorFn | null = null;
  private historyStack: View[] = [];
  private isListening = false;
  private isNavigatingInternal = false;

  public setNavigator(navigator: NavigatorFn): void {
    this.activeNavigator = navigator;
  }

  public getNavigator(): NavigatorFn | null {
    return this.activeNavigator;
  }

  public initHashHistory(): void {
    if (typeof window === "undefined" || this.isListening) return;
    this.isListening = true;

    // Track current initial view in stack
    const hashView = window.location.hash
      ? getPathView(window.location.hash)
      : null;
    const initialView =
      hashView === View.Guide
        ? View.Guide
        : uiStore.view || hashView || View.Vault;
    if (hashView === View.Guide) {
      setUiStore("view", View.Guide);
    }
    this.historyStack = [initialView];

    const handleHashChange = () => {
      if (this.isNavigatingInternal) {
        return;
      }

      const rawHash = window.location.hash || "#/vault";
      const targetView = getPathView(rawHash);

      // Extract itemId if present in hash query string (e.g. #/vault/detail?itemId=xyz)
      const qIdx = rawHash.indexOf("?");
      if (qIdx !== -1) {
        const searchParams = new URLSearchParams(rawHash.substring(qIdx + 1));
        const itemId = searchParams.get("itemId");
        if (itemId) {
          void setSessionStorageUseCase(
            SESSION_KEY_LAST_SELECTED_ITEM_ID,
            itemId,
          );
        }
      }

      setUiStore("view", targetView);

      // Track history stack movement
      const lastView = this.historyStack[this.historyStack.length - 1];
      if (lastView !== targetView) {
        this.historyStack.push(targetView);
      }

      const skipViews = [View.Login, View.Welcome, View.Fido2Prompt];
      if (!skipViews.includes(targetView)) {
        void setSessionStorageUseCase(SESSION_KEY_LAST_VIEW, targetView);
        if (targetView !== View.ItemDetail && targetView !== View.ItemEdit) {
          void removeSessionStorageUseCase(SESSION_KEY_LAST_SELECTED_ITEM_ID);
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
  }

  public navigate(to: string, options?: { replace?: boolean }): void {
    if (this.activeNavigator) {
      this.activeNavigator(to, options);
    }
  }

  public pushView(view: View, replace = false): void {
    if (this.historyStack.length === 0) {
      this.historyStack.push(view);
      return;
    }
    if (replace) {
      this.historyStack[this.historyStack.length - 1] = view;
    } else {
      const last = this.historyStack[this.historyStack.length - 1];
      if (last !== view) {
        this.historyStack.push(view);
      }
    }
  }

  public canGoBack(): boolean {
    return this.historyStack.length > 1;
  }

  public popView(): View | undefined {
    return this.historyStack.pop();
  }

  public peekView(): View | undefined {
    return this.historyStack[this.historyStack.length - 1];
  }

  public resetToRoot(view: View): void {
    this.historyStack = [view];
  }

  public getHistoryStack(): readonly View[] {
    return this.historyStack;
  }

  public setInternalNavigating(val: boolean): void {
    this.isNavigatingInternal = val;
  }
}

export const navigationManager = new NavigationManager();

export function setActiveNavigator(navigator: NavigatorFn): void {
  navigationManager.setNavigator(navigator);
}

export function initHashHistory(): void {
  navigationManager.initHashHistory();
}

export function navigatePath(
  newPath: string,
  options?: { replace?: boolean },
): void {
  const targetView = getPathView(newPath);
  setUiStore("view", targetView);

  const ROOT_TABS = [View.Vault, View.Generator, View.Reports, View.Settings];
  if (ROOT_TABS.includes(targetView) && !options?.replace) {
    navigationManager.resetToRoot(targetView);
  } else {
    navigationManager.pushView(targetView, options?.replace);
  }
  navigationManager.navigate(newPath, options);

  // Sync with browser hash if available
  if (typeof window !== "undefined") {
    const targetHash = newPath.startsWith("#") ? newPath : `#${newPath}`;
    if (window.location.hash !== targetHash) {
      navigationManager.setInternalNavigating(true);
      try {
        if (options?.replace) {
          window.location.replace(targetHash);
        } else {
          window.location.hash = targetHash;
        }
      } finally {
        // Reset after microtask to prevent hashchange listener from looping
        queueMicrotask(() => {
          navigationManager.setInternalNavigating(false);
        });
      }
    }
  }

  const skipViews = [View.Login, View.Welcome, View.Fido2Prompt];
  if (!skipViews.includes(targetView)) {
    void setSessionStorageUseCase(SESSION_KEY_LAST_VIEW, targetView);
    if (targetView !== View.ItemDetail && targetView !== View.ItemEdit) {
      void removeSessionStorageUseCase(SESSION_KEY_LAST_SELECTED_ITEM_ID);
    }
  }
}

export function navigate(newView: View, options?: { replace?: boolean }): void {
  const targetPath = getViewPath(newView);
  navigatePath(targetPath, options);
}

export function goBack(fallbackView?: View): void {
  if (navigationManager.getHistoryStack().length === 0 && uiStore.view) {
    navigationManager.pushView(uiStore.view);
  }

  let targetView: View | undefined;
  if (navigationManager.canGoBack()) {
    navigationManager.popView(); // pop current
    targetView = navigationManager.peekView(); // previous view
  }

  const destination =
    targetView ??
    fallbackView ??
    (uiStore.view ? getParentView(uiStore.view) : View.Vault);

  navigate(destination, { replace: true });
}

function setCurrentSelectedItem(
  item: VaultItem | null,
  targetView: View = View.ItemDetail,
): void {
  setUiStore(STORE_KEY_SELECTED_ITEM, item);
  if (item) {
    const targetPath = `${getViewPath(targetView)}?itemId=${encodeURIComponent(item.id)}`;
    navigatePath(targetPath);
    void setSessionStorageUseCase(SESSION_KEY_LAST_SELECTED_ITEM_ID, item.id);
  } else {
    void removeSessionStorageUseCase(SESSION_KEY_LAST_SELECTED_ITEM_ID);
  }
}

export function selectItem(
  item: VaultItem | null,
  targetView: View = View.ItemDetail,
): void {
  setCurrentSelectedItem(item, targetView);
}

export async function openItem(
  item: VaultItem,
  targetView: View = View.ItemDetail,
): Promise<void> {
  if (item.reprompt === 1) {
    const authorized = await requestReprompt();
    if (!authorized) return;
  }
  setCurrentSelectedItem(item, targetView);
}
