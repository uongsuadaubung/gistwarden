import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { accountStore, settingsStore, uiStore } from "@/core/store.ts";
import { navigate, openItem, selectItem } from "@/core/navigation.ts";
import {
  addFolder,
  deleteVaultItems,
  moveVaultItemsToFolder,
  renameFolder,
  saveItem,
} from "@/features/vault/vault-service.ts";
import {
  confirm,
  copyToClipboardWithMessage,
  setGlobalLoading,
  showToast,
} from "@gistwarden/ui";
import { Header } from "@/components/ui/Header.tsx";
import FolderModal from "@/components/ui/FolderModal.tsx";
import MoveToFolderModal from "@/features/vault/components/MoveToFolderModal.tsx";
import { type Folder, VaultItemType } from "@gistwarden/domain";
import { createDefaultVaultItem } from "@/features/vault/item-edit/vault-edit-helper.ts";
import { VaultBatchActionBar } from "@/features/vault/components/VaultBatchActionBar.tsx";
import { getCurrentTab, sendMessageToTab } from "@/core/tabs.ts";

import {
  MSG_AUTOFILL_CREDENTIALS,
  SESSION_KEY_SELECTED_FILTER_TYPE,
  SESSION_KEY_SHOW_FILTER_PANEL,
  SESSION_KEY_VAULT_SEARCH_QUERY,
} from "@/core/constants.ts";
import { View } from "@/core/types.ts";
import type { VaultItem } from "@gistwarden/domain";
import { generateTotpSafe } from "@/core/totp-utils.ts";
import { z } from "zod";
import {
  CloseIcon,
  FilterIcon,
  ListCheckIcon,
  SearchIcon,
} from "@/icons/svg/index.ts";
import { Input } from "@/components/ui/Input.tsx";
import { VaultItemRow } from "@/features/vault/VaultItemRow.tsx";
import { t } from "@/core/i18n.ts";
import { safeParseUrl } from "@/core/domain-utils.ts";
import { deleteVaultItemWithConfirm } from "@/features/vault/vault-utils.ts";
import {
  createSessionSignal,
  createSessionStorageSignal,
} from "@/core/session-signal.ts";
import { VaultFilterPanel } from "@/features/vault/components/VaultFilterPanel.tsx";
import {
  filterMatchingDomainItems,
  filterVaultItemsByQuery,
} from "@gistwarden/domain";

const AutofillResponseSchema = z.object({
  success: z.boolean(),
});

const VaultItemTypeSchema = z.nativeEnum(VaultItemType);

export const Vault: Component = () => {
  const [search, updateSearch] = createSessionSignal(
    SESSION_KEY_VAULT_SEARCH_QUERY,
    "",
  );
  const [activeMenuId, setActiveMenuId] = createSignal("");
  const [activeOptionsMenuId, setActiveOptionsMenuId] = createSignal("");
  const [contextMenuPos, setContextMenuPos] = createSignal<
    {
      x: number;
      y: number;
    } | null
  >(null);
  const [currentTabDomain, setCurrentTabDomain] = createSignal("");

  const [showFilterPanel, setShowFilterPanel] = createSessionSignal(
    SESSION_KEY_SHOW_FILTER_PANEL,
    false,
  );

  const [selectedFilterType, selectFilterType] = createSessionStorageSignal<
    VaultItemType | "all"
  >(
    SESSION_KEY_SELECTED_FILTER_TYPE,
    "all",
    String,
    (raw) => {
      if (raw === "all") return "all";
      const num = parseInt(raw, 10);
      const parsed = VaultItemTypeSchema.safeParse(num);
      return parsed.success ? parsed.data : "all";
    },
  );

  const [selectedFolderId, setSelectedFolderId] = createSignal<
    string | "no_folder"
  >("no_folder");

  const [showFolderModal, setShowFolderModal] = createSignal(false);
  const [editingFolder, setEditingFolder] = createSignal<Folder | null>(null);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = createSignal(false);

  const handleSaveFolder = async (name: string): Promise<boolean> => {
    const current = editingFolder();
    setGlobalLoading(true);
    let res;
    if (current) {
      res = await renameFolder(current.id, name);
    } else {
      res = await addFolder(name);
    }
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(
        current ? t("folder_rename_success") : t("folder_add_success"),
        "success",
      );
      setShowFolderModal(false);
      setEditingFolder(null);
      return true;
    } else {
      showToast(t(res.error), "error");
      return false;
    }
  };

  const toggleFilterPanel = () => {
    const nextVal = !showFilterPanel();
    setShowFilterPanel(nextVal);
    if (!nextVal) {
      selectFilterType("all");
      setSelectedFolderId("no_folder");
    }
  };

  const [isSelectMode, setIsSelectMode] = createSignal(false);
  const [selectedItemIds, setSelectedItemIds] = createSignal<Set<string>>(
    new Set<string>(),
  );

  const toggleSelectMode = () => {
    const nextVal = !isSelectMode();
    setIsSelectMode(nextVal);
    setSelectedItemIds(new Set<string>());
  };

  const toggleSelectItem = (id: string) => {
    const current = new Set(selectedItemIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    setSelectedItemIds(current);
  };

  const getAllVisibleItemIds = (): string[] => {
    const ids: string[] = [];
    if (!search() && matchingItems().length > 0) {
      matchingItems().forEach((item) => ids.push(item.id));
    }
    cardItems().forEach((item) => ids.push(item.id));
    identityItems().forEach((item) => ids.push(item.id));
    favoriteItems().forEach((item) => ids.push(item.id));
    regularItems().forEach((item) => ids.push(item.id));
    return Array.from(new Set(ids));
  };

  const handleSelectAll = () => {
    const visibleIds = getAllVisibleItemIds();
    if (selectedItemIds().size >= visibleIds.length && visibleIds.length > 0) {
      setSelectedItemIds(new Set<string>());
    } else {
      setSelectedItemIds(new Set(visibleIds));
    }
  };

  const handleDeleteSelected = async () => {
    const selected = Array.from(selectedItemIds());
    if (selected.length === 0) return;

    const confirmed = await confirm(
      t("vault_confirm_bulk_delete_title"),
      t("vault_confirm_bulk_delete_msg", { count: selected.length }),
      "danger",
    );
    if (!confirmed) return;

    setGlobalLoading(true);
    const res = await deleteVaultItems(selected);
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(t("toast_success"), "success");
      setSelectedItemIds(new Set<string>());
      setIsSelectMode(false);
    } else {
      showToast(t(res.error), "error");
    }
  };

  const handleMoveSelectedToFolder = async (
    targetFolderId: string | null,
  ): Promise<boolean> => {
    const selected = Array.from(selectedItemIds());
    if (selected.length === 0) return false;

    setGlobalLoading(true);
    const res = await moveVaultItemsToFolder(selected, targetFolderId);
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(
        t("vault_move_to_folder_success", { count: selected.length }),
        "success",
      );
      setSelectedItemIds(new Set<string>());
      setIsSelectMode(false);
      setShowMoveToFolderModal(false);
      return true;
    } else {
      showToast(t(res.error), "error");
      return false;
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
      setContextMenuPos(null);
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

  const matchingItems = () => {
    return filterMatchingDomainItems(
      accountStore.vaultItems,
      currentTabDomain(),
    );
  };

  const allItems = () => {
    let items = filterVaultItemsByQuery(
      accountStore.vaultItems,
      search(),
      String(selectedFilterType()),
    );

    if (showFilterPanel()) {
      if (selectedFolderId() === "no_folder") {
        items = items.filter((item) => !item.folderId);
      } else {
        items = items.filter((item) => item.folderId === selectedFolderId());
      }
    }

    return items;
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
    await copyToClipboardWithMessage(text, "detail_copied");
    setActiveMenuId(""); // Close menu
  };

  const handleCopyTotpDirect = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    const rawSecret = item.type === VaultItemType.Login
      ? (item.login.totp || "")
      : "";
    if (!rawSecret.trim()) return;

    const generateTotpResult = await generateTotpSafe(
      rawSecret,
      settingsStore.timeOffset,
    );

    if (generateTotpResult.isOk()) {
      await copyToClipboardWithMessage(
        generateTotpResult.value,
        "detail_totp_copied",
      );
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
      setContextMenuPos(null);
    } else {
      setContextMenuPos(null);
      setActiveOptionsMenuId(itemId);
    }
  };

  const handleContextMenuRow = (itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(""); // Close copy dropdown
    if (activeOptionsMenuId() === itemId) {
      setActiveOptionsMenuId("");
      setContextMenuPos(null);
    } else {
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setActiveOptionsMenuId(itemId);
    }
  };

  const handleSelectFromMenu = (itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!isSelectMode()) {
      setIsSelectMode(true);
    }
    const current = new Set(selectedItemIds());
    current.add(itemId);
    setSelectedItemIds(current);
    setActiveOptionsMenuId("");
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
      showToast(t(res.error), "error");
    }
    setActiveOptionsMenuId(""); // Close options dropdown
  };

  const handleCloneItem = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    setActiveOptionsMenuId(""); // Close options dropdown

    const clonedItem: VaultItem = {
      ...item,
      id: "",
      name: `${item.name} - ${t("vault_item_clone_suffix")}`,
    };

    await openItem(clonedItem, View.ItemEdit);
  };

  const handleDeleteItem = async (item: VaultItem, e: MouseEvent) => {
    e.stopPropagation();
    setActiveOptionsMenuId(""); // Close options dropdown immediately
    await deleteVaultItemWithConfirm(item, () => {});
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
          showToast(t(rawResponseRes.error), "error");
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
        onAddNewFolder={() => {
          setEditingFolder(null);
          setShowFolderModal(true);
        }}
      />

      {/* Main Body */}
      <div class="app-body">
        {/* Sticky Search & Filter Header */}
        <div class="vault-sticky-header">
          <Show
            when={isSelectMode()}
            fallback={
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
                  class={`filter-toggle-btn ${
                    showFilterPanel() ? "active" : ""
                  }`}
                  onClick={toggleFilterPanel}
                  title={t("vault_filter_title")}
                >
                  <FilterIcon />
                </button>
                <button
                  type="button"
                  class="filter-toggle-btn select-mode-toggle-btn"
                  onClick={toggleSelectMode}
                  title={t("vault_btn_select_mode")}
                >
                  <ListCheckIcon />
                </button>
              </div>
            }
          >
            <VaultBatchActionBar
              selectedCount={selectedItemIds().size}
              allVisibleCount={getAllVisibleItemIds().length}
              foldersCount={accountStore.folders.length}
              onToggleSelectMode={toggleSelectMode}
              onSelectAll={handleSelectAll}
              onDeleteSelected={handleDeleteSelected}
              onMoveToFolder={() => setShowMoveToFolderModal(true)}
            />
          </Show>

          {/* Filter Panel */}
          <VaultFilterPanel
            showFilterPanel={showFilterPanel()}
            selectedFilterType={selectedFilterType()}
            onSelectFilterType={selectFilterType}
            folders={accountStore.folders}
            selectedFolderId={selectedFolderId()}
            onSelectFolderId={setSelectedFolderId}
          />
        </div>

        {/* Sync Error */}
        <Show when={uiStore.syncError}>
          <div class="alert alert-danger alert-compact">
            {uiStore.syncError}
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
                  isSelectMode={isSelectMode()}
                  isSelected={selectedItemIds().has(item.id)}
                  onToggleSelect={toggleSelectItem}
                  onSelectFromMenu={handleSelectFromMenu}
                  contextMenuPos={activeOptionsMenuId() === item.id
                    ? contextMenuPos()
                    : null}
                  onContextMenuRow={handleContextMenuRow}
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
                  isSelectMode={isSelectMode()}
                  isSelected={selectedItemIds().has(item.id)}
                  onToggleSelect={toggleSelectItem}
                  onSelectFromMenu={handleSelectFromMenu}
                  contextMenuPos={activeOptionsMenuId() === item.id
                    ? contextMenuPos()
                    : null}
                  onContextMenuRow={handleContextMenuRow}
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
                  isSelectMode={isSelectMode()}
                  isSelected={selectedItemIds().has(item.id)}
                  onToggleSelect={toggleSelectItem}
                  onSelectFromMenu={handleSelectFromMenu}
                  contextMenuPos={activeOptionsMenuId() === item.id
                    ? contextMenuPos()
                    : null}
                  onContextMenuRow={handleContextMenuRow}
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
                  isSelectMode={isSelectMode()}
                  isSelected={selectedItemIds().has(item.id)}
                  onToggleSelect={toggleSelectItem}
                  onSelectFromMenu={handleSelectFromMenu}
                  contextMenuPos={activeOptionsMenuId() === item.id
                    ? contextMenuPos()
                    : null}
                  onContextMenuRow={handleContextMenuRow}
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
                  isSelectMode={isSelectMode()}
                  isSelected={selectedItemIds().has(item.id)}
                  onToggleSelect={toggleSelectItem}
                  onSelectFromMenu={handleSelectFromMenu}
                  contextMenuPos={activeOptionsMenuId() === item.id
                    ? contextMenuPos()
                    : null}
                  onContextMenuRow={handleContextMenuRow}
                />
              )}
            </For>
          </Show>
        </div>
      </div>

      <FolderModal
        isOpen={showFolderModal()}
        folder={editingFolder()}
        onClose={() => {
          setShowFolderModal(false);
          setEditingFolder(null);
        }}
        onSave={handleSaveFolder}
      />

      <MoveToFolderModal
        isOpen={showMoveToFolderModal()}
        folders={accountStore.folders}
        onClose={() => setShowMoveToFolderModal(false)}
        onConfirm={handleMoveSelectedToFolder}
      />
    </div>
  );
};
export default Vault;
