import { err, Result, ResultAsync } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export function hasContextMenus(): boolean {
  return typeof chrome !== "undefined" && !!chrome.contextMenus;
}

export async function removeAllContextMenus(): Promise<
  Result<void, TranslationKey>
> {
  if (!hasContextMenus()) return err("storage_error");
  return await ResultAsync.fromPromise(
    chrome.contextMenus.removeAll(),
    (_e): TranslationKey => "storage_error",
  );
}

export async function createContextMenu(
  createProperties: chrome.contextMenus.CreateProperties,
): Promise<Result<string | number, TranslationKey>> {
  if (!hasContextMenus()) return err("storage_error");
  return await ResultAsync.fromPromise(
    Promise.resolve(chrome.contextMenus.create(createProperties)),
    (_e): TranslationKey => "storage_error",
  );
}

export type ContextMenuClickHandler = (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
) => void;

/**
 * Register a listener for chrome.contextMenus.onClicked with safety checks.
 * Returns an unbind function to remove the listener.
 */
export function onContextMenuClick(
  handler: ContextMenuClickHandler,
): () => void {
  if (!hasContextMenus() || !chrome.contextMenus?.onClicked) {
    return () => {};
  }

  chrome.contextMenus.onClicked.addListener(handler);
  return () => {
    chrome.contextMenus.onClicked.removeListener(handler);
  };
}
