import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { store } from "@/shared/store.ts";
import { VaultItemType } from "@/shared/types.ts";
import { lock, logout } from "@/shared/auth-service.ts";
import { syncVault } from "@/shared/vault-service.ts";
import { confirm } from "@/shared/ui-service.ts";
import { handlePopout, isPopout } from "@/shared/popout-utils.ts";
import { t } from "@/shared/i18n.ts";
import {
  LockIcon,
  LogoutIcon,
  PlusIcon,
  PopoutIcon,
  SyncIcon,
} from "@/icons/svg/index.ts";

interface HeaderProps {
  title: string;
  showAdd?: boolean;
  onAddNewItem?: (type: VaultItemType) => void;
}

export const Header: Component<HeaderProps> = (props) => {
  const [showAddMenu, setShowAddMenu] = createSignal(false);
  const [showProfileMenu, setShowProfileMenu] = createSignal(false);
  const [imgFailed, setImgFailed] = createSignal(false);

  onMount(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element) {
        if (!target.closest(".add-menu-container")) {
          setShowAddMenu(false);
        }
        if (!target.closest(".profile-menu-container")) {
          setShowProfileMenu(false);
        }
      }
    };
    window.addEventListener("click", handleOutsideClick);
    onCleanup(() => {
      window.removeEventListener("click", handleOutsideClick);
    });
  });

  const initials = () => {
    const login = store.cachedGithubUser?.login;
    if (!login) return "ME";
    if (login.length >= 2) {
      return login.slice(0, 2).toUpperCase();
    }
    return login.toUpperCase();
  };

  const getTypeLabel = (type: VaultItemType) => {
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
        return "";
    }
  };

  const handleAddTypeClick = (type: VaultItemType, e: MouseEvent) => {
    e.stopPropagation();
    setShowAddMenu(false);
    if (props.onAddNewItem) {
      props.onAddNewItem(type);
    }
  };

  const handleOpenGistClick = (e: MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(false);
    if (store.gistId) {
      window.open(`https://gist.github.com/${store.gistId}`, "_blank");
    }
  };

  const handleSyncClick = async (e: MouseEvent) => {
    e.stopPropagation();
    if (store.syncing) return;
    await syncVault();
  };

  const handleLockClick = (e: MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(false);
    lock();
  };

  const handleLogoutClick = async (e: MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(false);
    if (
      await confirm(
        t("settings_logout_title"),
        t("settings_logout_msg"),
        "warning",
      )
    ) {
      logout();
    }
  };

  return (
    <header class="app-header">
      <div class="header-title">{props.title}</div>
      <div class="header-actions">
        {/* + New Button */}
        <Show when={props.showAdd}>
          <div class="add-menu-container">
            <button
              class="header-btn-new"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(!showAddMenu());
              }}
              title={t("vault_btn_add")}
            >
              <PlusIcon />
              <span>{t("vault_btn_add")}</span>
            </button>
            <Show when={showAddMenu()}>
              <div class="add-dropdown" onClick={(e) => e.stopPropagation()}>
                <For
                  each={[
                    VaultItemType.Login,
                    VaultItemType.SecureNote,
                    VaultItemType.Card,
                    VaultItemType.Identity,
                    VaultItemType.SshKey,
                  ]}
                >
                  {(type) => (
                    <button
                      class="dropdown-item"
                      type="button"
                      onClick={(e) => handleAddTypeClick(type, e)}
                    >
                      {getTypeLabel(type)}
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        {/* Popout Button */}
        <Show when={!isPopout()}>
          <button
            class="header-icon-btn"
            type="button"
            onClick={handlePopout}
            title={t("vault_popout_title")}
          >
            <PopoutIcon />
          </button>
        </Show>

        {/* Profile Avatar Button */}
        <div class="profile-menu-container">
          <div
            class={`profile-avatar-btn ${
              store.cachedGithubUser?.avatar_url && !imgFailed()
                ? "has-image"
                : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu());
            }}
            title={store.cachedGithubUser?.login || "Profile"}
          >
            <Show
              when={store.cachedGithubUser?.avatar_url && !imgFailed()}
              fallback={initials()}
            >
              <img
                src={store.cachedGithubUser?.avatar_url}
                alt="Avatar"
                class="profile-avatar-img"
                onError={() => setImgFailed(true)}
              />
            </Show>
          </div>
          <Show when={showProfileMenu()}>
            <div class="profile-dropdown" onClick={(e) => e.stopPropagation()}>
              <Show when={store.cachedGithubUser}>
                <div class="profile-info">
                  <span
                    class="profile-username cursor-pointer"
                    onClick={handleOpenGistClick}
                    title={t("settings_open_gist_title")}
                  >
                    @{store.cachedGithubUser?.login}
                  </span>
                </div>
                <div class="dropdown-divider" />
              </Show>

              {/* Sync Option */}
              <button
                class="dropdown-item"
                type="button"
                onClick={handleSyncClick}
              >
                <SyncIcon class={store.syncing ? "spinning" : ""} />
                <span>{t("vault_btn_sync")}</span>
              </button>

              {/* Lock Option */}
              <button
                class="dropdown-item"
                type="button"
                onClick={handleLockClick}
              >
                <LockIcon />
                <span>{t("vault_lock_title")}</span>
              </button>

              {/* Logout Option */}
              <button
                class="dropdown-item"
                type="button"
                onClick={handleLogoutClick}
              >
                <LogoutIcon class="text-error" />
                <span class="text-error">{t("settings_logout_title")}</span>
              </button>
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
};

export default Header;
