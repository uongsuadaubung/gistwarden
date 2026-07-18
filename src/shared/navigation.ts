import { setStore, store } from "./store.ts";
import { type VaultItem, View } from "./types.ts";
import { requestReprompt } from "./ui-service.ts";

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
}

export function selectItem(item: VaultItem | null) {
  setStore("selectedItem", item);
  if (item) {
    transitionToggle = !transitionToggle;
    const suffix = transitionToggle ? "a" : "b";
    setStore({
      view: View.ItemDetail,
      transitionClass: `slide-forward-${suffix}`,
    });
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
  setStore("selectedItem", item);
  transitionToggle = !transitionToggle;
  const suffix = transitionToggle ? "a" : "b";
  setStore({
    view: targetView,
    transitionClass: `slide-forward-${suffix}`,
  });
}
