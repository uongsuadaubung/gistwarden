import { type Component, Match, Show, Switch } from "solid-js";
import { View } from "@/core/types.ts";
import {
  isCardItem,
  isIdentityItem,
  isLoginItem,
  isSshKeyItem,
  VaultItemType,
} from "@gistwarden/domain";
import type {
  CardVaultItem,
  IdentityVaultItem,
  SshKeyVaultItem,
  VaultItem,
} from "@gistwarden/domain";
import {
  ExternalLinkIcon,
  GlobeIcon,
  IdentityIcon,
  NoteIcon,
  SshKeyIcon,
} from "@/icons/svg/index.ts";
import { openItem } from "@/core/navigation.ts";
import { openTab } from "@/core/tabs.ts";
import { t } from "@/core/i18n.ts";
import CardBrandIcon from "@/components/ui/CardBrandIcon.tsx";
import { getDomainFromItem } from "@/core/domain-utils.ts";
import Favicon from "@/components/ui/Favicon.tsx";
import { Checkbox } from "@/components/ui/Checkbox.tsx";
import { VaultItemCopyMenu } from "@/features/vault/components/VaultItemCopyMenu.tsx";
import { VaultItemOptionsMenu } from "@/features/vault/components/VaultItemOptionsMenu.tsx";

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
  isSuggested?: boolean;
  onFillItem?: (item: VaultItem, e: MouseEvent) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (itemId: string, e: MouseEvent) => void;
  onSelectFromMenu?: (itemId: string, e: MouseEvent) => void;
  contextMenuPos?: { x: number; y: number } | null;
  onContextMenuRow?: (itemId: string, e: MouseEvent) => void;
}

const getCardSub = (item: CardVaultItem): string => {
  const brand = item.card.brand || "Card";
  const number = item.card.number || "";
  const last4 = number.length > 4 ? number.slice(-4) : number;
  return `${brand}${last4 ? `, *${last4}` : ""}`;
};

const getIdentitySub = (item: IdentityVaultItem): string => {
  const first = item.identity.firstName || "";
  const last = item.identity.lastName || "";
  return `${first} ${last}`.trim() || t("detail_identity_title");
};

const getSshKeySub = (item: SshKeyVaultItem): string => {
  return item.sshKey.keyFingerprint || "SSH Key";
};

export const VaultItemRow: Component<VaultItemRowProps> = (props) => {
  const domain = () => getDomainFromItem(props.item);

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

  const handleRowClick = (e: MouseEvent) => {
    if (props.isSelectMode) {
      if (props.onToggleSelect) {
        props.onToggleSelect(props.item.id, e);
      }
    } else {
      openItem(props.item, View.ItemDetail);
    }
  };

  return (
    <div
      class={`vault-item-row ${props.isSelectMode ? "selectable" : ""} ${
        props.isSelected ? "selected" : ""
      }`}
      onClick={handleRowClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (props.onContextMenuRow) {
          props.onContextMenuRow(props.item.id, e);
        } else {
          props.onToggleOptionsMenu(props.item.id, e);
        }
      }}
    >
      {/* Selection Checkbox */}
      <Show when={props.isSelectMode}>
        <div class="item-select-checkbox">
          <Checkbox
            id={`select-${props.item.id}`}
            checked={!!props.isSelected}
            onChange={() => {}}
          />
        </div>
      </Show>
      {/* Icon Container */}
      <div class="item-icon-container">
        <Show when={Number(props.item.type) === VaultItemType.SecureNote}>
          <NoteIcon />
        </Show>
        <Show when={isCardItem(props.item) ? props.item : null}>
          {(cardItem) => <CardBrandIcon brand={cardItem().card.brand || ""} />}
        </Show>
        <Show when={Number(props.item.type) === VaultItemType.Identity}>
          <IdentityIcon />
        </Show>
        <Show when={Number(props.item.type) === VaultItemType.SshKey}>
          <SshKeyIcon />
        </Show>
        <Show when={Number(props.item.type) === VaultItemType.Login}>
          <Show
            when={domain()}
            fallback={<GlobeIcon />}
          >
            {(dom) => <Favicon domain={dom()} fallback={<GlobeIcon />} />}
          </Show>
        </Show>
      </div>

      {/* Info Container */}
      <div class="item-info">
        <div class="item-name d-flex align-center gap-6">
          {props.item.name}
        </div>

        <Show when={Number(props.item.type) !== VaultItemType.SecureNote}>
          <div class="item-sub">
            <Switch>
              <Match when={isLoginItem(props.item) ? props.item : null}>
                {(loginItem) =>
                  loginItem().login.username || t("vault_no_username")}
              </Match>
              <Match when={isCardItem(props.item) ? props.item : null}>
                {(cardItem) => getCardSub(cardItem())}
              </Match>
              <Match when={isIdentityItem(props.item) ? props.item : null}>
                {(identityItem) => getIdentitySub(identityItem())}
              </Match>
              <Match when={isSshKeyItem(props.item) ? props.item : null}>
                {(sshItem) => getSshKeySub(sshItem())}
              </Match>
            </Switch>
          </div>
        </Show>
      </div>

      {/* Options Copy Dropdown Button */}
      <Show when={!props.isSelectMode}>
        <div class="item-actions pos-relative">
          <Show
            when={props.isSuggested &&
              Number(props.item.type) === VaultItemType.Login}
          >
            <button
              type="button"
              class="fill-btn"
              onClick={(e) => {
                e.stopPropagation();
                props.onFillItem?.(props.item, e);
              }}
            >
              Fill
            </button>
          </Show>

          <Show when={getUri()}>
            {(uri) => (
              <button
                class="action-btn"
                title={t("detail_visit_website")}
                onClick={(e) => {
                  e.stopPropagation();
                  let url = uri();
                  if (url && !url.match(/^[a-zA-Z]+:\/\//)) {
                    url = `https://${url}`;
                  }
                  if (url) openTab(url);
                }}
              >
                <ExternalLinkIcon />
              </button>
            )}
          </Show>

          {/* Copy Options Action (Button + Overlay) */}
          <VaultItemCopyMenu
            item={props.item}
            activeMenuId={props.activeMenuId}
            onToggleMenu={props.onToggleMenu}
            onCopyText={props.onCopyText}
            onCopyTotpDirect={props.onCopyTotpDirect}
          />

          {/* Item Options Action (Button + Overlay) */}
          <VaultItemOptionsMenu
            item={props.item}
            activeOptionsMenuId={props.activeOptionsMenuId}
            contextMenuPos={props.contextMenuPos}
            onToggleOptionsMenu={props.onToggleOptionsMenu}
            onSelectFromMenu={props.onSelectFromMenu}
            onFavoriteItem={props.onFavoriteItem}
            onCloneItem={props.onCloneItem}
            onDeleteItem={props.onDeleteItem}
          />
        </div>
      </Show>
    </div>
  );
};
