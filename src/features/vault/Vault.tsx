import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { store } from "@/core/store.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { deleteItem, saveItem } from "@/features/vault/vault-service.ts";
import { confirm, setGlobalLoading, showToast } from "@/core/ui-service.ts";
import { Header } from "@/components/ui/Header.tsx";
import { createDefaultVaultItem } from "@/features/vault/item-edit/vault-edit-helper.ts";
import { getCurrentTab, sendMessageToTab } from "@/core/tabs.ts";

import {
  MSG_AUTOFILL_CREDENTIALS,
  SESSION_KEY_SELECTED_FILTER_TYPE,
  SESSION_KEY_SHOW_FILTER_PANEL,
  SESSION_KEY_VAULT_SEARCH_QUERY,
} from "@/core/constants.ts";
import { type VaultItem, VaultItemType, View } from "@/core/types.ts";
import { generateTotpSafe } from "@/core/totp-utils.ts";
import { z } from "zod";
import {
  CardIcon,
  ChevronDownIcon,
  CloseIcon,
  FilterIcon,
  GlobeIcon,
  IdentityIcon,
  KeyIcon,
  ListIcon,
  NoteIcon,
  SearchIcon,
} from "@/icons/svg/index.ts";
import { Input } from "@/components/ui/Input.tsx";
import { VaultItemRow } from "@/features/vault/VaultItemRow.tsx";
import { t } from "@/core/i18n.ts";
import {
  getBaseDomain,
  getHostname,
  safeParseUrl,
} from "@/core/domain-utils.ts";

const AutofillResponseSchema = z.object({
  success: z.boolean(),
});

function isVaultItemType(val: number): val is VaultItemType {
  return (
    val === VaultItemType.Login ||
    val === VaultItemType.SecureNote ||
    val === VaultItemType.Card ||
    val === VaultItemType.Identity ||
    val === VaultItemType.SshKey
  );
}

export const Vault: Component = () => {
  const [search, setSearch] = createSignal(
    sessionStorage.getItem(SESSION_KEY_VAULT_SEARCH_QUERY) || "",
  );

  const updateSearch = (val: string) => {
    setSearch(val);
    sessionStorage.setItem(SESSION_KEY_VAULT_SEARCH_QUERY, val);
  };
  const [activeMenuId, setActiveMenuId] = createSignal("");
  const [activeOptionsMenuId, setActiveOptionsMenuId] = createSignal("");
  const [currentTabDomain, setCurrentTabDomain] = createSignal("");

  const [showFilterPanel, setShowFilterPanel] = createSignal(
    sessionStorage.getItem(SESSION_KEY_SHOW_FILTER_PANEL) === "true",
  );
  const [selectedFilterType, setSelectedFilterType] = createSignal<
    VaultItemType | "all"
  >(
    (() => {
      const saved = sessionStorage.getItem(SESSION_KEY_SELECTED_FILTER_TYPE);
      if (saved && saved !== "all") {
        const parsed = parseInt(saved, 10);
        if (isVaultItemType(parsed)) {
          return parsed;
        }
      }
      return "all";
    })(),
  );
  const [showTypeDropdown, setShowTypeDropdown] = createSignal(false);

  const toggleFilterPanel = () => {
    const nextVal = !showFilterPanel();
    setShowFilterPanel(nextVal);
    sessionStorage.setItem(SESSION_KEY_SHOW_FILTER_PANEL, String(nextVal));
    if (!nextVal) {
      selectFilterType("all");
    }
  };

  const selectFilterType = (type: VaultItemType | "all") => {
    setSelectedFilterType(type);
    sessionStorage.setItem(SESSION_KEY_SELECTED_FILTER_TYPE, String(type));
    setShowTypeDropdown(false);
  };

  const getTypeLabel = (type: VaultItemType | "all") => {
    switch (type) {
      case VaultItemType.Login:
        return t("vault_item_login");
      case VaultItemType.Card:
        return t("vault_item_card");
      case VaultItemType.Identity:
        return t("vault_item_identity");
      case VaultItemType.SecureNote:
        return t("vault_item_note");
      case VaultItemType.SshKey:
        return t("vault_item_ssh_key");
      default:
        return t("vault_filter_type");
    }
  };

  onMount(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element) {
        if (
          target.closest(".action-btn") ||
          target.closest(".copy-dropdown") ||
          target.closest(".options-dropdown")
        ) {
          return;
        }
        if (
          target.closest(".filter-dropdown-trigger") ||
          target.closest(".filter-dropdown-menu")
        ) {
          return;
        }
      }
      setActiveMenuId("");
      setActiveOptionsMenuId("");
      setShowTypeDropdown(false);
    };
    document.addEventListener("click", handleGlobalClick);
    onCleanup(() => {
      document.removeEventListener("click", handleGlobalClick);
    });

    // Query active tab domain
    const fetchTab = async () => {
      const tabRes = await getCurrentTab();
      if (tabRes.isOk() && tabRes.value && tabRes.value.url) {
        const urlResult = safeParseUrl(tabRes.value!.url!);
        if (urlResult.isOk()) {
          let hostname = urlResult.value.hostname;
          if (hostname.startsWith("www.")) {
            hostname = hostname.slice(4);
          }
          setCurrentTabDomain(hostname);
        }
      }
    };
    fetchTab();
  });

  const isMatchingDomain = (item: VaultItem, domain: string) => {
    if (!domain) return false;
    const targetBase = getBaseDomain(domain);
    if (!targetBase) return false;

    if (item.name.toLowerCase().includes(targetBase)) return true;
    if (item.type === VaultItemType.Login && item.login.uris) {
      return item.login.uris.some((u) => {
        const itemBase = getBaseDomain(u.uri);
        return itemBase && itemBase === targetBase;
      });
    }
    return false;
  };

  const isExactDomainMatch = (item: VaultItem, domain: string) => {
    if (!domain) return false;
    const targetHost = getHostname(domain);
    if (!targetHost) return false;

    if (item.name.toLowerCase().includes(targetHost)) return true;
    if (item.type === VaultItemType.Login && item.login.uris) {
      return item.login.uris.some((u) => {
        const itemHost = getHostname(u.uri);
        return itemHost && itemHost === targetHost;
      });
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
    let list = store.vaultItems;
    const filterType = selectedFilterType();
    if (filterType && filterType !== "all") {
      list = list.filter((item) => item.type === filterType);
    }
    const filtered = list.filter((item) => isMatchingDomain(item, domain));

    return [...filtered].sort((a, b) => {
      const aExact = isExactDomainMatch(a, domain);
      const bExact = isExactDomainMatch(b, domain);

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      return a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  };

  const allItems = () => {
    const q = search().toLowerCase().trim();
    const filterType = selectedFilterType();
    let list = store.vaultItems;
    if (filterType && filterType !== "all") {
      list = list.filter((item) => item.type === filterType);
    }
    if (q) {
      list = list.filter((item) => {
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

  const cardItems = () => {
    return allItems().filter((item) => item.type === VaultItemType.Card);
  };

  const identityItems = () => {
    return allItems().filter((item) => item.type === VaultItemType.Identity);
  };

  const favoriteItems = () => {
    return allItems().filter(
      (item) =>
        item.favorite &&
        item.type !== VaultItemType.Card &&
        item.type !== VaultItemType.Identity,
    );
  };

  const regularItems = () => {
    return allItems().filter(
      (item) =>
        !item.favorite &&
        item.type !== VaultItemType.Card &&
        item.type !== VaultItemType.Identity,
    );
  };

  const handleCopyText = async (text: string, _type: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showToast(t("detail_copied"), "success");
    setActiveMenuId(""); // Close menu
  };

  const handleCopyTotpDirect = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    const rawSecret = item.type === VaultItemType.Login
      ? (item.login.totp || "")
      : "";
    if (!rawSecret.trim()) return;

    const generateTotpResult = generateTotpSafe(rawSecret, store.timeOffset);

    if (generateTotpResult.isOk()) {
      await navigator.clipboard.writeText(generateTotpResult.value);
      showToast(t("detail_totp_copied"), "success");
    } else {
      showToast(t(generateTotpResult.error), "error");
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
    setGlobalLoading(true);
    const res = await saveItem(updated);
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(t("toast_success"), "success");
    } else {
      showToast(t(res.error) || t("toast_error"), "error");
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

    setGlobalLoading(true);
    const res = await saveItem(cloned);
    setGlobalLoading(false);
    if (res.isOk()) {
      showToast(t("toast_success"), "success");
    } else {
      showToast(t(res.error) || t("toast_error"), "error");
    }
    setActiveOptionsMenuId(""); // Close options dropdown
  };

  const handleDeleteItem = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    setActiveOptionsMenuId(""); // Close options dropdown immediately

    const confirmed = await confirm(
      t("edit_confirm_delete_title"),
      t("edit_confirm_delete_msg", { name: item.name }),
      "danger",
    );
    if (confirmed) {
      setGlobalLoading(true);
      const res = await deleteItem(item.id);
      setGlobalLoading(false);
      if (res.isOk()) {
        showToast(t("toast_success"), "success");
      } else {
        showToast(t(res.error) || t("toast_error"), "error");
      }
    }
  };

  const handleFillItem = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    if (item.type !== VaultItemType.Login) return;

    const username = item.login.username || "";
    const password = item.login.password || "";

    const activeTabRes = await getCurrentTab();
    if (activeTabRes.isOk() && activeTabRes.value) {
      const activeTab = activeTabRes.value;
      if (activeTab.id !== undefined) {
        const rawResponseRes = await sendMessageToTab(activeTab.id, {
          type: MSG_AUTOFILL_CREDENTIALS,
          username,
          password,
        });

        if (rawResponseRes.isOk()) {
          const parseResult = AutofillResponseSchema.safeParse(
            rawResponseRes.value,
          );
          if (parseResult.success && parseResult.data.success) {
            showToast(t("toast_success"), "success");
          }
        } else {
          console.warn("Autofill failed:", rawResponseRes.error);
          showToast(t("toast_error"), "error");
        }
      }
    }
  };

  const handleAddNewItem = (type: VaultItemType) => {
    selectItem(createDefaultVaultItem(type));
    navigate(View.ItemEdit);
  };

  return (
    <div class="app-container">
      {/* Header */}
      <Header
        title={t("nav_vault")}
        showAdd={true}
        onAddNewItem={handleAddNewItem}
      />

      {/* Main Body */}
      <div class="app-body">
        {/* Search */}
        <div class="search-row">
          <div class="search-container">
            <SearchIcon class="search-icon" />
            <Input
              type="text"
              placeholder={t("vault_search_placeholder")}
              value={search()}
              onInput={(e) => updateSearch(e.currentTarget.value)}
            />
            <Show when={search()}>
              <button
                type="button"
                class="search-clear-btn"
                onClick={() => updateSearch("")}
                title={t("btn_clear")}
              >
                <CloseIcon />
              </button>
            </Show>
          </div>
          <button
            type="button"
            class={`filter-toggle-btn ${showFilterPanel() ? "active" : ""}`}
            onClick={toggleFilterPanel}
            title={t("vault_filter_title")}
          >
            <FilterIcon />
          </button>
        </div>

        {/* Filter Panel */}
        <Show when={showFilterPanel()}>
          <div class="filter-panel">
            <div
              class="filter-dropdown-trigger"
              onClick={() => setShowTypeDropdown(!showTypeDropdown())}
            >
              <ListIcon class="dropdown-icon" />
              <span class="dropdown-label">
                {getTypeLabel(selectedFilterType())}
              </span>
              <ChevronDownIcon
                class={`chevron-icon ${showTypeDropdown() ? "open" : ""}`}
              />
            </div>
            <Show when={showTypeDropdown()}>
              <div class="filter-dropdown-menu">
                <div
                  class={`dropdown-item ${
                    selectedFilterType() === "all" ? "selected" : ""
                  }`}
                  onClick={() => selectFilterType("all")}
                >
                  <ListIcon class="item-icon" />
                  <span>{t("vault_filter_all_types")}</span>
                </div>
                <div
                  class={`dropdown-item ${
                    selectedFilterType() === VaultItemType.Login
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => selectFilterType(VaultItemType.Login)}
                >
                  <GlobeIcon class="item-icon" />
                  <span>{t("vault_item_login")}</span>
                </div>
                <div
                  class={`dropdown-item ${
                    selectedFilterType() === VaultItemType.Card
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => selectFilterType(VaultItemType.Card)}
                >
                  <CardIcon class="item-icon" />
                  <span>{t("vault_item_card")}</span>
                </div>
                <div
                  class={`dropdown-item ${
                    selectedFilterType() === VaultItemType.Identity
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => selectFilterType(VaultItemType.Identity)}
                >
                  <IdentityIcon class="item-icon" />
                  <span>{t("vault_item_identity")}</span>
                </div>
                <div
                  class={`dropdown-item ${
                    selectedFilterType() === VaultItemType.SecureNote
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => selectFilterType(VaultItemType.SecureNote)}
                >
                  <NoteIcon class="item-icon" />
                  <span>{t("vault_item_note")}</span>
                </div>
                <div
                  class={`dropdown-item ${
                    selectedFilterType() === VaultItemType.SshKey
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => selectFilterType(VaultItemType.SshKey)}
                >
                  <KeyIcon class="item-icon" />
                  <span>{t("vault_item_ssh_key")}</span>
                </div>
              </div>
            </Show>
          </div>
        </Show>

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
                  isSuggested={true}
                  onFillItem={handleFillItem}
                />
              )}
            </For>
            <div class="vault-section-divider"></div>
          </Show>

          {/* 2. Cards section */}
          <Show when={cardItems().length > 0}>
            <div class="section-header">
              <div class="vault-section-title m-0">
                {t("vault_section_cards")}
              </div>
              <span class="section-badge">
                {cardItems().length}
              </span>
            </div>
            <For each={cardItems()}>
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

          {/* 3. Identities section */}
          <Show when={identityItems().length > 0}>
            <div class="section-header">
              <div class="vault-section-title m-0">
                {t("vault_section_identities")}
              </div>
              <span class="section-badge">
                {identityItems().length}
              </span>
            </div>
            <For each={identityItems()}>
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

          {/* 4. Favorite items section */}
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

          {/* 5. Regular items section (All Items) */}
          <Show
            when={regularItems().length > 0 ||
              (favoriteItems().length === 0 && cardItems().length === 0 &&
                identityItems().length === 0)}
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
