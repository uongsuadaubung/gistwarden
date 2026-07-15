import { type Component, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { store, storeActions } from "@/shared/store.ts";
import { View, type VaultItem } from "@/shared/types.ts";
import { POPUP_WIDTH, POPOUT_HEIGHT } from "@/shared/constants.ts";
import * as OTPAuth from "otpauth";
import { parseTotpSecret } from "@/shared/totp-utils.ts";
import { CopyIcon, ExternalLinkIcon, LockIcon, PlusIcon, SearchIcon, SyncIcon, HeartFilledIcon } from "@/icons/svg/index.ts";
import { Input } from "./Input.tsx";

export const Vault: Component = () => {
  const [search, setSearch] = createSignal("");
  const [activeMenuId, setActiveMenuId] = createSignal("");
  const [currentTabDomain, setCurrentTabDomain] = createSignal("");

  onMount(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element) {
        if (target.closest(".action-btn") || target.closest(".copy-dropdown")) {
          return;
        }
      }
      setActiveMenuId("");
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
    if (item.login?.uris) {
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
        const usernameMatch = item.login?.username?.toLowerCase().includes(q);
        const uriMatch = item.login?.uris?.some((u) => u.uri.toLowerCase().includes(q));
        return nameMatch || usernameMatch || uriMatch;
      });
    }
    return store.vaultItems;
  };

  const favoriteItems = () => {
    return allItems().filter((item) => !!item.favorite);
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
    const rawSecret = item.login?.totp || "";
    if (!rawSecret.trim()) return;

    try {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(parseTotpSecret(rawSecret))
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

  const handleAddNewItem = () => {
    storeActions.selectItem({
      id: "",
      type: 1, // Login
      name: "",
      notes: "",
      favorite: false,
      login: {
        username: "",
        password: "",
        totp: "",
        uris: [],
        fido2Credentials: [],
      },
    });
    storeActions.navigate(View.ItemEdit);
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
          if (parentWindow.left !== undefined && parentWindow.width !== undefined) {
            left = Math.round(parentWindow.left + parentWindow.width - POPUP_WIDTH - offsetRight);
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

  const renderItemRow = (item: VaultItem) => {
    return (
      <div class="vault-item-row" onClick={() => storeActions.selectItem(item)}>
        <div class="item-info">
          <div class="item-name" style="display: flex; align-items: center; gap: 6px;">
            {item.name}
            <Show when={item.favorite}>
              <HeartFilledIcon style="width: 12px; height: 12px; color: #ff4e63; flex-shrink: 0;" />
            </Show>
          </div>
          <div class="item-sub">
            <Show when={item.login?.fido2Credentials && item.login.fido2Credentials.length > 0}>
              <span class="passkey-badge">PASSKEY</span>
            </Show>
            {item.login?.username || "Không có tên đăng nhập"}
          </div>
        </div>
        
        {/* Options Copy Dropdown Button */}
        <div class="item-actions pos-relative">
          <button
            class="action-btn"
            title="Lựa chọn sao chép"
            onClick={(e) => handleToggleMenu(item.id, e)}
          >
            <CopyIcon />
          </button>

          {/* Dropdown overlay */}
          <Show when={activeMenuId() === item.id}>
            <div class="copy-dropdown" onClick={(e) => e.stopPropagation()}>
              <Show when={item.login?.username}>
                <div class="dropdown-item" onClick={(e) => handleCopyText(item.login!.username!, "tên đăng nhập", e)}>
                  Sao chép Tên đăng nhập
                </div>
              </Show>
              <Show when={item.login?.password}>
                <div class="dropdown-item" onClick={(e) => handleCopyText(item.login!.password!, "mật khẩu", e)}>
                  Sao chép Mật khẩu
                </div>
              </Show>
              <Show when={item.login?.totp}>
                <div class="dropdown-item" onClick={(e) => handleCopyTotpDirect(item, e)}>
                  Sao chép Mã TOTP
                </div>
              </Show>
              <Show when={!item.login?.username && !item.login?.password && !item.login?.totp}>
                <div class="dropdown-item disabled">Không có gì để sao chép</div>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    );
  };

  return (
    <div class="app-container">
      {/* Header */}
      <header class="app-header">
        <span>Gistwarden</span>
        <div class="header-actions">
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
              {(item) => renderItemRow(item)}
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
              {(item) => renderItemRow(item)}
            </For>
            <div class="vault-section-divider"></div>
          </Show>

          {/* 3. Regular items section */}
          <Show when={regularItems().length > 0 || favoriteItems().length === 0}>
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
            
            <For each={regularItems()} fallback={
              <div class="no-items">
                {search() ? "Không tìm thấy tài khoản nào khớp" : "Két sắt của bạn trống rỗng. Thêm mới tài khoản bằng nút + bên dưới."}
              </div>
            }>
              {(item) => renderItemRow(item)}
            </For>
          </Show>
        </div>

        {/* Add Button FAB */}
        <div class="fab" onClick={handleAddNewItem} title="Thêm tài khoản mới">
          <PlusIcon />
        </div>
      </div>

    </div>
  );
};
export default Vault;
