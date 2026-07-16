import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import { type VaultItem, VaultItemType, View } from "@/shared/types.ts";
import { POPOUT_HEIGHT, POPUP_WIDTH } from "@/shared/constants.ts";
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

export const Vault: Component = () => {
  const [search, setSearch] = createSignal("");
  const [activeMenuId, setActiveMenuId] = createSignal("");
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
        if (target.closest(".action-btn") || target.closest(".copy-dropdown")) {
          return;
        }
      }
      setActiveMenuId("");
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

  const matchingItems = () => {
    const domain = currentTabDomain();
    if (!domain) return [];
    return store.vaultItems.filter((item) => isMatchingDomain(item, domain));
  };

  const allItems = () => {
    const q = search().toLowerCase().trim();
    if (q) {
      return store.vaultItems.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const usernameMatch = item.type === VaultItemType.Login &&
          item.login.username?.toLowerCase().includes(q);
        const uriMatch = item.type === VaultItemType.Login &&
          item.login.uris?.some((u) => u.uri.toLowerCase().includes(q));
        return nameMatch || usernameMatch || uriMatch;
      });
    }
    return store.vaultItems;
  };

  const favoriteItems = () => {
    return allItems().filter((item) => item.favorite);
  };

  const regularItems = () => {
    return allItems().filter((item) => !item.favorite);
  };

  const handleCopyText = async (text: string, type: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    storeActions.showToast(`Đã sao chép ${type}!`, "success");
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
      storeActions.showToast("Đã sao chép mã TOTP!", "success");
    } catch (err) {
      console.error("[Gistwarden] Vault copy TOTP error:", err);
      storeActions.showToast("Lỗi sinh mã TOTP!", "error");
    }
    setActiveMenuId(""); // Close menu
  };

  const handleToggleMenu = (itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (activeMenuId() === itemId) {
      setActiveMenuId("");
    } else {
      setActiveMenuId(itemId);
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

  const isPopout = () => {
    return new URLSearchParams(window.location.search).get("mode") === "tab";
  };

  const handlePopout = () => {
    if (typeof chrome !== "undefined" && chrome.windows) {
      chrome.windows.getLastFocused((parentWindow) => {
        let left: number | undefined;
        let top: number | undefined;

        if (parentWindow) {
          const offsetRight = 20;
          const offsetTop = 80;
          if (
            parentWindow.left !== undefined && parentWindow.width !== undefined
          ) {
            left = Math.round(
              parentWindow.left + parentWindow.width - POPUP_WIDTH -
                offsetRight,
            );
          }
          if (parentWindow.top !== undefined) {
            top = Math.round(parentWindow.top + offsetTop);
          }
        }

        chrome.windows.create({
          url: chrome.runtime.getURL("popup.html?mode=tab"),
          type: "popup",
          width: POPUP_WIDTH,
          height: POPOUT_HEIGHT,
          left,
          top,
        });
        window.close();
      });
    }
  };

  return (
    <div class="app-container">
      {/* Header */}
      <header class="app-header">
        <span>Gistwarden</span>
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
              Thêm mới
            </button>
            <Show when={showAddMenu()}>
              <div class="add-dropdown" onClick={(e) => e.stopPropagation()}>
                <div class="dropdown-item" onClick={handleAddNewLogin}>
                  Mật khẩu
                </div>
                <div class="dropdown-item" onClick={handleAddNewNote}>
                  Ghi chú
                </div>
              </div>
            </Show>
          </div>

          {/* Popout Button */}
          <Show when={!isPopout()}>
            <ExternalLinkIcon onClick={handlePopout} title="Mở cửa sổ riêng" />
          </Show>
          {/* Sync Button */}
          <SyncIcon
            onClick={handleSync}
            class={store.syncing ? "spinning" : ""}
            title="Đồng bộ ngay"
          />
          {/* Lock Button */}
          <LockIcon onClick={handleLock} title="Khóa két sắt" />
        </div>
      </header>

      {/* Main Body */}
      <div class="app-body">
        {/* Search */}
        <div class="search-container">
          <SearchIcon class="search-icon" />
          <Input
            type="text"
            placeholder="Tìm kiếm tài khoản..."
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
                Đề xuất cho trang web này
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
                  onToggleMenu={handleToggleMenu}
                  onCopyText={handleCopyText}
                  onCopyTotpDirect={handleCopyTotpDirect}
                />
              )}
            </For>
            <div class="vault-section-divider"></div>
          </Show>

          {/* 2. Favorite items section */}
          <Show when={favoriteItems().length > 0}>
            <div class="section-header">
              <div class="vault-section-title m-0">
                Yêu thích
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
                  onToggleMenu={handleToggleMenu}
                  onCopyText={handleCopyText}
                  onCopyTotpDirect={handleCopyTotpDirect}
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
                <Show when={search()} fallback="Tất cả tài khoản">
                  Kết quả tìm kiếm
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
                    ? "Không tìm thấy tài khoản nào khớp"
                    : "Két sắt của bạn trống rỗng. Thêm mới tài khoản bằng nút + bên dưới."}
                </div>
              }
            >
              {(item) => (
                <VaultItemRow
                  item={item}
                  activeMenuId={activeMenuId()}
                  onToggleMenu={handleToggleMenu}
                  onCopyText={handleCopyText}
                  onCopyTotpDirect={handleCopyTotpDirect}
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
