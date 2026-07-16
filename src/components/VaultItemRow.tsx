import { type Component, createSignal, Show, type JSX } from "solid-js";
import { type VaultItem, VaultItemType } from "@/shared/types.ts";
import { CopyIcon, HeartFilledIcon, KeyIcon, NoteIcon } from "@/icons/svg/index.ts";
import { storeActions } from "@/shared/store.ts";

interface VaultItemRowProps {
  item: VaultItem;
  activeMenuId: string;
  onToggleMenu: (itemId: string, e: MouseEvent) => void;
  onCopyText: (text: string, type: string, e: MouseEvent) => void;
  onCopyTotpDirect: (item: VaultItem, e: MouseEvent) => void;
}

const getDomain = (item: VaultItem): string | null => {
  if (item.type !== VaultItemType.Login || !item.login.uris || item.login.uris.length === 0) {
    return null;
  }
  const uri = item.login.uris[0].uri;
  if (!uri) return null;
  try {
    let urlStr = uri.trim();
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = "https://" + urlStr;
    }
    const url = new URL(urlStr);
    let hostname = url.hostname;
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch (_e) {
    return null;
  }
};

const Favicon: Component<{ domain: string; fallback: JSX.Element }> = (props) => {
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
                  props.item.login.username) || "Không có tên đăng nhập"}
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
        <button
          class="action-btn"
          title={props.item.type === VaultItemType.SecureNote
            ? "Sao chép ghi chú"
            : "Lựa chọn sao chép"}
          onClick={(e) => {
            if (props.item.type === VaultItemType.SecureNote) {
              props.onCopyText(props.item.notes || "", "ghi chú", e);
            } else {
              props.onToggleMenu(props.item.id, e);
            }
          }}
        >
          <CopyIcon />
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
                    "tên đăng nhập",
                    e,
                  )}
              >
                Sao chép Tên đăng nhập
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
                    "mật khẩu",
                    e,
                  )}
              >
                Sao chép Mật khẩu
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
                Sao chép Mã TOTP
              </div>
            </Show>
            <Show
              when={props.item.type !== VaultItemType.Login ||
                (!props.item.login.username && !props.item.login.password &&
                  !props.item.login.totp)}
            >
              <div class="dropdown-item disabled">Không có gì để sao chép</div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default VaultItemRow;
