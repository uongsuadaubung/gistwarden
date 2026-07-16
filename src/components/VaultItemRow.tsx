import { type Component, createSignal, type JSX, Show } from "solid-js";
import { type VaultItem, VaultItemType, View } from "@/shared/types.ts";
import {
  CopyIcon,
  HeartFilledIcon,
  KeyIcon,
  NoteIcon,
  ExternalLinkIcon,
  MoreVerticalIcon,
} from "@/icons/svg/index.ts";
import { storeActions } from "@/shared/store.ts";
import { t } from "@/shared/i18n.ts";

interface VaultItemRowProps {
  item: VaultItem;
  activeMenuId: string;
  activeOptionsMenuId: string;
  onToggleMenu: (itemId: string, e: MouseEvent) => void;
  onToggleOptionsMenu: (itemId: string, e: MouseEvent) => void;
  onCopyText: (text: string, type: string, e: MouseEvent) => void;
  onCopyTotpDirect: (item: VaultItem, e: MouseEvent) => void;
  onFavoriteItem: (item: VaultItem, e: MouseEvent) => void;
  onCloneItem: (item: VaultItem, e: MouseEvent) => void;
  onDeleteItem: (item: VaultItem, e: MouseEvent) => void;
}

const getDomain = (item: VaultItem): string | null => {
  if (
    item.type !== VaultItemType.Login || !item.login.uris ||
    item.login.uris.length === 0
  ) {
    return null;
  }
  const uri = item.login.uris[0].uri;
  try {
    let hostname = uri;
    if (!/^https?:\/\//i.test(hostname)) {
      hostname = "http://" + hostname;
    }
    const url = new URL(hostname);
    return url.hostname;
  } catch (_e) {
    return null;
  }
};

const Favicon: Component<{ domain: string; fallback: JSX.Element }> = (
  props,
) => {
  const [hasError, setHasError] = createSignal(false);
  return (
    <Show when={!hasError()} fallback={props.fallback}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${props.domain}&sz=32`}
        alt=""
        onError={() => setHasError(true)}
      />
    </Show>
  );
};

export const VaultItemRow: Component<VaultItemRowProps> = (props) => {
  const domain = () => getDomain(props.item);

  const getUri = (): string | null => {
    if (
      props.item.type === VaultItemType.Login &&
      props.item.login.uris &&
      props.item.login.uris.length > 0 &&
      props.item.login.uris[0].uri
    ) {
      return props.item.login.uris[0].uri;
    }
    return null;
  };

  return (
    <div
      class="vault-item-row"
      onClick={() => storeActions.selectItem(props.item)}
    >
      {/* Icon Container */}
      <div class="item-icon-container">
        <Show
          when={props.item.type === VaultItemType.SecureNote}
          fallback={
            <Show
              when={domain()}
              fallback={<KeyIcon />}
            >
              {(dom) => <Favicon domain={dom()} fallback={<KeyIcon />} />}
            </Show>
          }
        >
          <NoteIcon />
        </Show>
      </div>

      {/* Info Container */}
      <div class="item-info">
        <Show
          when={props.item.type === VaultItemType.SecureNote}
          fallback={
            <>
              <div
                class="item-name"
                style="display: flex; align-items: center; gap: 6px;"
              >
                {props.item.name}
                <Show when={props.item.favorite}>
                  <HeartFilledIcon style="width: 12px; height: 12px; color: #ff4e63; flex-shrink: 0;" />
                </Show>
              </div>
              <div class="item-sub">
                <Show
                  when={props.item.type === VaultItemType.Login &&
                    props.item.login.fido2Credentials &&
                    props.item.login.fido2Credentials.length > 0}
                >
                  <span class="passkey-badge">PASSKEY</span>
                </Show>
                {(props.item.type === VaultItemType.Login &&
                  props.item.login.username) || t("vault_no_username")}
              </div>
            </>
          }
        >
          <div
            class="item-name"
            style="display: flex; align-items: center; gap: 6px;"
          >
            {props.item.name}
            <Show when={props.item.favorite}>
              <HeartFilledIcon style="width: 12px; height: 12px; color: #ff4e63; flex-shrink: 0;" />
            </Show>
          </div>
        </Show>
      </div>

      {/* Options Copy Dropdown Button */}
      <div class="item-actions pos-relative">
        <Show when={getUri()}>
          {(uri) => (
            <button
              class="action-btn"
              title={t("detail_visit_website")}
              onClick={(e) => {
                e.stopPropagation();
                let url = uri();
                if (!/^https?:\/\//i.test(url)) {
                  url = "https://" + url;
                }
                if (typeof chrome !== "undefined" && chrome.tabs) {
                  chrome.tabs.create({ url });
                } else {
                  window.open(url, "_blank");
                }
              }}
            >
              <ExternalLinkIcon />
            </button>
          )}
        </Show>

        <button
          class="action-btn"
          title={props.item.type === VaultItemType.SecureNote
            ? t("vault_copy_notes")
            : t("vault_copy_options")}
          onClick={(e) => {
            if (props.item.type === VaultItemType.SecureNote) {
              props.onCopyText(props.item.notes || "", t("edit_type_note"), e);
            } else {
              props.onToggleMenu(props.item.id, e);
            }
          }}
        >
          <CopyIcon />
        </button>

        <button
          class="action-btn"
          title={t("vault_menu_more")}
          onClick={(e) => props.onToggleOptionsMenu(props.item.id, e)}
        >
          <MoreVerticalIcon />
        </button>

        {/* Dropdown overlay */}
        <Show
          when={props.item.type !== VaultItemType.SecureNote &&
            props.activeMenuId === props.item.id}
        >
          <div class="copy-dropdown" onClick={(e) => e.stopPropagation()}>
            <Show
              when={props.item.type === VaultItemType.Login &&
                props.item.login.username}
            >
              <div
                class="dropdown-item"
                onClick={(e) =>
                  props.onCopyText(
                    props.item.type === VaultItemType.Login &&
                        props.item.login.username || "",
                    t("edit_label_username"),
                    e,
                  )}
              >
                {t("detail_copy_username")}
              </div>
            </Show>
            <Show
              when={props.item.type === VaultItemType.Login &&
                props.item.login.password}
            >
              <div
                class="dropdown-item"
                onClick={(e) =>
                  props.onCopyText(
                    props.item.type === VaultItemType.Login &&
                        props.item.login.password || "",
                    t("edit_label_password"),
                    e,
                  )}
              >
                {t("detail_copy_password")}
              </div>
            </Show>
            <Show
              when={props.item.type === VaultItemType.Login &&
                props.item.login.totp}
            >
              <div
                class="dropdown-item"
                onClick={(e) => props.onCopyTotpDirect(props.item, e)}
              >
                {t("detail_copy_totp")}
              </div>
            </Show>
          </div>
        </Show>

        {/* Options Dropdown overlay */}
        <Show when={props.activeOptionsMenuId === props.item.id}>
          <div class="options-dropdown" onClick={(e) => e.stopPropagation()}>
            <div
              class="dropdown-item"
              onClick={(e) => props.onFavoriteItem(props.item, e)}
            >
              {props.item.favorite ? t("vault_menu_unfavorite") : t("vault_menu_favorites")}
            </div>
            <div
              class="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                storeActions.selectItem(props.item);
                storeActions.navigate(View.ItemEdit);
              }}
            >
              {t("btn_edit")}
            </div>
            <div
              class="dropdown-item"
              onClick={(e) => props.onCloneItem(props.item, e)}
            >
              {t("btn_clone")}
            </div>
            <div
              class="dropdown-item text-danger"
              onClick={(e) => props.onDeleteItem(props.item, e)}
            >
              {t("btn_delete")}
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
