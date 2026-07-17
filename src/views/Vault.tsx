import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import { APP_NAME } from "@/shared/constants.ts";
import { type VaultItem, VaultItemType, View } from "@/shared/types.ts";
import { handlePopout, isPopout } from "@/shared/popout-utils.ts";
import * as OTPAuth from "otpauth";
import { parseTotpSecret } from "@/shared/totp-utils.ts";
import {
  ExternalLinkIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  SyncIcon,
} from "@/icons/svg/index.ts";
import { Input } from "@/components/Input.tsx";
import { VaultItemRow } from "@/components/VaultItemRow.tsx";
import { t } from "@/shared/i18n.ts";

export const Vault: Component = () => {
  const [search, setSearch] = createSignal("");
  const [activeMenuId, setActiveMenuId] = createSignal("");
  const [activeOptionsMenuId, setActiveOptionsMenuId] = createSignal("");
  const [currentTabDomain, setCurrentTabDomain] = createSignal("");
  const [showAddMenu, setShowAddMenu] = createSignal(false);

  onMount(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element) {
        if (
          target.closest(".add-new-header-btn") ||
          target.closest(".add-dropdown")
        ) {
          return;
        }
        if (
          target.closest(".action-btn") ||
          target.closest(".copy-dropdown") ||
          target.closest(".options-dropdown")
        ) {
          return;
        }
      }
      setActiveMenuId("");
      setActiveOptionsMenuId("");
      setShowAddMenu(false);
    };
    document.addEventListener("click", handleGlobalClick);
    onCleanup(() => {
      document.removeEventListener("click", handleGlobalClick);
    });

    // Query active tab domain
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url) {
          try {
            const urlObj = new URL(tab.url);
            let hostname = urlObj.hostname;
            if (hostname.startsWith("www.")) {
              hostname = hostname.slice(4);
            }
            setCurrentTabDomain(hostname);
          } catch (_err) {
            // Qua qua cac URL noi bo (chrome://, etc.)
          }
        }
      });
    }
  });

  const isMatchingDomain = (item: VaultItem, domain: string) => {
    if (!domain) return false;
    const d = domain.toLowerCase();
    if (item.name.toLowerCase().includes(d)) return true;
    if (item.type === VaultItemType.Login && item.login.uris) {
      return item.login.uris.some((u) => u.uri.toLowerCase().includes(d));
    }
    return false;
  };

  const sortByName = (items: VaultItem[]) => {
    return [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );
  };

  const matchingItems = () => {
    const domain = currentTabDomain();
    if (!domain) return [];
    const filtered = store.vaultItems.filter((item) =>
      isMatchingDomain(item, domain)
    );
    return sortByName(filtered);
  };

  const allItems = () => {
    const q = search().toLowerCase().trim();
    let list = store.vaultItems;
    if (q) {
      list = store.vaultItems.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const usernameMatch = item.type === VaultItemType.Login &&
          item.login.username?.toLowerCase().includes(q);
        const uriMatch = item.type === VaultItemType.Login &&
          item.login.uris?.some((u) => u.uri.toLowerCase().includes(q));
        return nameMatch || usernameMatch || uriMatch;
      });
    }
    return sortByName(list);
  };

  const favoriteItems = () => {
    return allItems().filter((item) => item.favorite);
  };

  const regularItems = () => {
    return allItems().filter((item) => !item.favorite);
  };

  const handleCopyText = async (text: string, _type: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    storeActions.showToast(t("detail_copied"), "success");
    setActiveMenuId(""); // Close menu
  };

  const handleCopyTotpDirect = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    const rawSecret = item.type === VaultItemType.Login
      ? (item.login.totp || "")
      : "";
    if (!rawSecret.trim()) return;

    try {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(parseTotpSecret(rawSecret)),
      });
      const code = totp.generate();
      await navigator.clipboard.writeText(code);
      storeActions.showToast(t("detail_totp_copied"), "success");
    } catch (err) {
      console.error(`[${APP_NAME}] Vault copy TOTP error:`, err);
      storeActions.showToast(t("toast_error"), "error");
    }
    setActiveMenuId(""); // Close menu
  };

  const handleToggleMenu = (itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    setActiveOptionsMenuId(""); // Close options menu
    if (activeMenuId() === itemId) {
      setActiveMenuId("");
    } else {
      setActiveMenuId(itemId);
    }
  };

  const handleToggleOptionsMenu = (itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(""); // Close copy dropdown
    if (activeOptionsMenuId() === itemId) {
      setActiveOptionsMenuId("");
    } else {
      setActiveOptionsMenuId(itemId);
    }
  };

  const handleFavoriteItem = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    const updated = {
      ...item,
      favorite: !item.favorite,
    };
    const res = await storeActions.saveItem(updated);
    if (res.success) {
      storeActions.showToast(t("toast_success"), "success");
    } else {
      storeActions.showToast(res.error || t("toast_error"), "error");
    }
    setActiveOptionsMenuId(""); // Close options dropdown
  };

  const handleCloneItem = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();

    // Omit ID to force saveItem into the "New" creation path
    const { id: _id, name, ...rest } = item;

    const cloned = {
      ...rest,
      name: `${name} - ${t("vault_item_clone_suffix")}`,
    };

    const res = await storeActions.saveItem(cloned);
    if (res.success) {
      storeActions.showToast(t("toast_success"), "success");
    } else {
      storeActions.showToast(res.error || t("toast_error"), "error");
    }
    setActiveOptionsMenuId(""); // Close options dropdown
  };

  const handleDeleteItem = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    setActiveOptionsMenuId(""); // Close options dropdown immediately

    const confirmed = await storeActions.confirm(
      t("edit_confirm_delete_title"),
      t("edit_confirm_delete_msg", { name: item.name }),
      "danger",
    );
    if (confirmed) {
      const res = await storeActions.deleteItem(item.id);
      if (res.success) {
        storeActions.showToast(t("toast_success"), "success");
      } else {
        storeActions.showToast(res.error || t("toast_error"), "error");
      }
    }
  };

  const handleAddNewLogin = () => {
    storeActions.selectItem({
      id: "",
      type: VaultItemType.Login,
      name: "",
      notes: "",
      favorite: false,
      fields: [],
      creationDate: "",
      revisionDate: "",
      login: {
        username: "",
        password: "",
        totp: "",
        uris: [],
        fido2Credentials: [],
      },
    });
    storeActions.navigate(View.ItemEdit);
    setShowAddMenu(false);
  };

  const handleAddNewNote = () => {
    storeActions.selectItem({
      id: "",
      type: VaultItemType.SecureNote,
      name: "",
      notes: "",
      favorite: false,
      fields: [],
      creationDate: "",
      revisionDate: "",
    });
    storeActions.navigate(View.ItemEdit);
    setShowAddMenu(false);
  };

  const handleLock = () => {
    storeActions.lock();
  };

  const handleSync = async () => {
    if (store.syncing) return;
    await storeActions.syncVault();
  };

  return (
    <div class="app-container">
      {/* Header */}
      <header class="app-header">
        <span>{APP_NAME}</span>
        <div class="header-actions">
          {/* Add New dropdown */}
          <div class="add-menu-container">
            <button
              class="add-new-header-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(!showAddMenu());
              }}
            >
              <PlusIcon style="width: 12px; height: 12px; margin-right: 4px; fill: currentColor;" />
              {t("vault_btn_add")}
            </button>
            <Show when={showAddMenu()}>
              <div class="add-dropdown" onClick={(e) => e.stopPropagation()}>
                <div class="dropdown-item" onClick={handleAddNewLogin}>
                  {t("vault_item_login")}
                </div>
                <div class="dropdown-item" onClick={handleAddNewNote}>
                  {t("vault_item_note")}
                </div>
              </div>
            </Show>
          </div>

          {/* Popout Button */}
          <Show when={!isPopout()}>
            <span
              style="display: inline-flex; cursor: pointer;"
              onClick={handlePopout}
              title={t("vault_popout_title")}
            >
              <ExternalLinkIcon />
            </span>
          </Show>
          {/* Sync Button */}
          <span
            style="display: inline-flex; cursor: pointer;"
            onClick={handleSync}
            title={t("vault_btn_sync")}
          >
            <SyncIcon class={store.syncing ? "spinning" : ""} />
          </span>
          {/* Lock Button */}
          <span
            style="display: inline-flex; cursor: pointer;"
            onClick={handleLock}
            title={t("vault_lock_title")}
          >
            <LockIcon />
          </span>
        </div>
      </header>

      {/* Main Body */}
      <div class="app-body">
        {/* Search */}
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <Input
            type="text"
            placeholder={t("vault_search_placeholder")}
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>

        {/* Sync Error */}
        <Show when={store.syncError}>
          <div class="alert alert-danger alert-compact">
            {store.syncError}
          </div>
        </Show>

        {/* Item List */}
        <div class="vault-list">
          {/* 1. Suggested items section (only when search is empty and we have matches) */}
          <Show when={!search() && matchingItems().length > 0}>
            <div class="section-header">
              <div class="vault-section-title m-0">
                {t("vault_suggested_items")}
              </div>
              <span class="section-badge">
                {matchingItems().length}
              </span>
            </div>
            <For each={matchingItems()}>
              {(item) => (
                <VaultItemRow
                  item={item}
                  activeMenuId={activeMenuId()}
                  activeOptionsMenuId={activeOptionsMenuId()}
                  onToggleMenu={handleToggleMenu}
                  onToggleOptionsMenu={handleToggleOptionsMenu}
                  onCopyText={handleCopyText}
                  onCopyTotpDirect={handleCopyTotpDirect}
                  onFavoriteItem={handleFavoriteItem}
                  onCloneItem={handleCloneItem}
                  onDeleteItem={handleDeleteItem}
                />
              )}
            </For>
            <div class="vault-section-divider"></div>
          </Show>

          {/* 2. Favorite items section */}
          <Show when={favoriteItems().length > 0}>
            <div class="section-header">
              <div class="vault-section-title m-0">
                {t("vault_menu_favorites")}
              </div>
              <span class="section-badge">
                {favoriteItems().length}
              </span>
            </div>
            <For each={favoriteItems()}>
              {(item) => (
                <VaultItemRow
                  item={item}
                  activeMenuId={activeMenuId()}
                  activeOptionsMenuId={activeOptionsMenuId()}
                  onToggleMenu={handleToggleMenu}
                  onToggleOptionsMenu={handleToggleOptionsMenu}
                  onCopyText={handleCopyText}
                  onCopyTotpDirect={handleCopyTotpDirect}
                  onFavoriteItem={handleFavoriteItem}
                  onCloneItem={handleCloneItem}
                  onDeleteItem={handleDeleteItem}
                />
              )}
            </For>
            <div class="vault-section-divider"></div>
          </Show>

          {/* 3. Regular items section */}
          <Show
            when={regularItems().length > 0 || favoriteItems().length === 0}
          >
            <div class="section-header">
              <div class="vault-section-title m-0">
                <Show when={search()} fallback={t("vault_all_items")}>
                  {t("vault_search_results")}
                </Show>
              </div>
              <span class="section-badge">
                {regularItems().length}
              </span>
            </div>

            <For
              each={regularItems()}
              fallback={
                <div class="no-items">
                  {search()
                    ? t("vault_no_search_matches")
                    : t("vault_empty_subtitle")}
                </div>
              }
            >
              {(item) => (
                <VaultItemRow
                  item={item}
                  activeMenuId={activeMenuId()}
                  activeOptionsMenuId={activeOptionsMenuId()}
                  onToggleMenu={handleToggleMenu}
                  onToggleOptionsMenu={handleToggleOptionsMenu}
                  onCopyText={handleCopyText}
                  onCopyTotpDirect={handleCopyTotpDirect}
                  onFavoriteItem={handleFavoriteItem}
                  onCloneItem={handleCloneItem}
                  onDeleteItem={handleDeleteItem}
                />
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
};
export default Vault;
