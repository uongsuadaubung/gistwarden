import { type Component, createSignal, For, Show } from "solid-js";
import { type Folder, VaultItemType } from "@gistwarden/domain";
import { getVaultItemTypeLabel } from "@/features/vault/vault-utils.ts";
import { t } from "@/core/i18n.ts";
import {
  CardIcon,
  ChevronDownIcon,
  FolderIcon,
  GlobeIcon,
  IdentityIcon,
  KeyIcon,
  ListIcon,
  NoteIcon,
} from "@/icons/svg/index.ts";

export interface VaultFilterPanelProps {
  showFilterPanel: boolean;
  selectedFilterType: VaultItemType | "all";
  onSelectFilterType: (type: VaultItemType | "all") => void;
  folders: Folder[];
  selectedFolderId: string | "no_folder";
  onSelectFolderId: (folderId: string | "no_folder") => void;
}

export const VaultFilterPanel: Component<VaultFilterPanelProps> = (props) => {
  const [showFolderDropdown, setShowFolderDropdown] = createSignal(false);
  const [showTypeDropdown, setShowTypeDropdown] = createSignal(false);

  const handleSelectType = (type: VaultItemType | "all") => {
    props.onSelectFilterType(type);
    setShowTypeDropdown(false);
  };

  const handleSelectFolder = (folderId: string | "no_folder") => {
    props.onSelectFolderId(folderId);
    setShowFolderDropdown(false);
  };

  const getFolderLabel = () => {
    if (props.selectedFolderId === "no_folder") {
      return t("items_with_no_folder");
    }
    const found = props.folders.find((f) => f.id === props.selectedFolderId);
    return found ? found.name : t("items_with_no_folder");
  };

  return (
    <Show when={props.showFilterPanel}>
      <div class="filter-panel">
        {/* Folder Dropdown - Only show when at least 1 folder exists */}
        <Show when={props.folders.length > 0}>
          <div class="filter-dropdown-container">
            <div
              class="filter-dropdown-trigger"
              onClick={() => {
                setShowFolderDropdown(!showFolderDropdown());
                setShowTypeDropdown(false);
              }}
            >
              <FolderIcon class="dropdown-icon" />
              <span class="dropdown-label">{getFolderLabel()}</span>
              <ChevronDownIcon
                class={`chevron-icon ${showFolderDropdown() ? "open" : ""}`}
              />
            </div>
            <Show when={showFolderDropdown()}>
              <div class="filter-dropdown-menu">
                <For each={props.folders}>
                  {(folder) => (
                    <div
                      class={`dropdown-item ${
                        props.selectedFolderId === folder.id ? "selected" : ""
                      }`}
                      onClick={() => handleSelectFolder(folder.id)}
                    >
                      <FolderIcon class="item-icon" />
                      <span>{folder.name}</span>
                    </div>
                  )}
                </For>
                <div
                  class={`dropdown-item ${
                    props.selectedFolderId === "no_folder" ? "selected" : ""
                  }`}
                  onClick={() => handleSelectFolder("no_folder")}
                >
                  <FolderIcon class="item-icon" />
                  <span>{t("items_with_no_folder")}</span>
                </div>
              </div>
            </Show>
          </div>
        </Show>

        {/* Type Dropdown */}
        <div class="filter-dropdown-container">
          <div
            class="filter-dropdown-trigger"
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown());
              setShowFolderDropdown(false);
            }}
          >
            <ListIcon class="dropdown-icon" />
            <span class="dropdown-label">
              {getVaultItemTypeLabel(props.selectedFilterType)}
            </span>
            <ChevronDownIcon
              class={`chevron-icon ${showTypeDropdown() ? "open" : ""}`}
            />
          </div>
          <Show when={showTypeDropdown()}>
            <div class="filter-dropdown-menu">
              <div
                class={`dropdown-item ${
                  props.selectedFilterType === "all" ? "selected" : ""
                }`}
                onClick={() => handleSelectType("all")}
              >
                <ListIcon class="item-icon" />
                <span>{t("vault_filter_all_types")}</span>
              </div>
              <div
                class={`dropdown-item ${
                  props.selectedFilterType === VaultItemType.Login
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleSelectType(VaultItemType.Login)}
              >
                <GlobeIcon class="item-icon" />
                <span>{t("vault_item_login")}</span>
              </div>
              <div
                class={`dropdown-item ${
                  props.selectedFilterType === VaultItemType.Card
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleSelectType(VaultItemType.Card)}
              >
                <CardIcon class="item-icon" />
                <span>{t("vault_item_card")}</span>
              </div>
              <div
                class={`dropdown-item ${
                  props.selectedFilterType === VaultItemType.Identity
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleSelectType(VaultItemType.Identity)}
              >
                <IdentityIcon class="item-icon" />
                <span>{t("vault_item_identity")}</span>
              </div>
              <div
                class={`dropdown-item ${
                  props.selectedFilterType === VaultItemType.SecureNote
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleSelectType(VaultItemType.SecureNote)}
              >
                <NoteIcon class="item-icon" />
                <span>{t("vault_item_note")}</span>
              </div>
              <div
                class={`dropdown-item ${
                  props.selectedFilterType === VaultItemType.SshKey
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleSelectType(VaultItemType.SshKey)}
              >
                <KeyIcon class="item-icon" />
                <span>{t("vault_item_ssh_key")}</span>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};
