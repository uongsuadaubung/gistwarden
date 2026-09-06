import {
  type VaultItem,
  type VaultItemId,
  VaultItemType,
} from "@gistwarden/domain";
import { type Component, Show } from "solid-js";
import { Checkbox } from "@/components/ui/Checkbox.tsx";
import { t } from "@/core/i18n.ts";
import { openItem } from "@/core/navigation.ts";
import { openTab } from "@/core/tabs.ts";
import { View } from "@/core/types.ts";
import { VaultItemCopyMenu } from "@/features/vault/components/VaultItemCopyMenu.tsx";
import { VaultItemOptionsMenu } from "@/features/vault/components/VaultItemOptionsMenu.tsx";
import { getVaultItemStrategy } from "@/features/vault/registry/vault-item-registry.ts";
import { ExternalLinkIcon } from "@/icons/svg/index.ts";

interface VaultItemRowProps {
  item: VaultItem;
  activeMenuId: VaultItemId | "";
  activeOptionsMenuId: VaultItemId | "";
  onToggleMenu: (itemId: VaultItemId, e: MouseEvent) => void;

  onToggleOptionsMenu: (itemId: VaultItemId, e: MouseEvent) => void;
  onCopyText: (text: string, type: string, e: MouseEvent) => void;
  onCopyTotpDirect: (item: VaultItem, e: MouseEvent) => void;
  onFavoriteItem: (item: VaultItem, e: MouseEvent) => void;
  onCloneItem: (item: VaultItem, e: MouseEvent) => void;
  onDeleteItem: (item: VaultItem, e: MouseEvent) => void;
  isSuggested?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (itemId: VaultItemId, e: MouseEvent) => void;
  onSelectFromMenu?: (itemId: VaultItemId, e: MouseEvent) => void;
  contextMenuPos?: { x: number; y: number } | null;
  onContextMenuRow?: (itemId: VaultItemId, e: MouseEvent) => void;
}

export const VaultItemRow: Component<VaultItemRowProps> = (props) => {
  const strategy = () => getVaultItemStrategy(props.item.type);

  const getUri = (): string | null => {
    if (props.item.type === VaultItemType.Login && props.item.login.uris) {
      const firstUri = props.item.login.uris[0];
      if (firstUri?.uri) {
        return firstUri.uri;
      }
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
      <div class="item-icon-container">{strategy().renderIcon(props.item)}</div>

      {/* Info Container */}
      <div class="item-info">
        <div class="item-name d-flex align-center gap-6">{props.item.name}</div>

        <Show when={strategy().getSubtitle(props.item)}>
          {(subtitle) => <div class="item-sub">{subtitle()}</div>}
        </Show>
      </div>

      {/* Options Copy Dropdown Button */}
      <Show when={!props.isSelectMode}>
        <div class="item-actions pos-relative">
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
