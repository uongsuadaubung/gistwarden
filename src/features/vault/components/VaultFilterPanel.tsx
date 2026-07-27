import { type Component, createSignal, Show } from "solid-js";
import { VaultItemType } from "@/features/vault/vault-types.ts";
import { getVaultItemTypeLabel } from "@/features/vault/vault-utils.ts";
import { t } from "@/core/i18n.ts";
import {
  CardIcon,
  ChevronDownIcon,
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
}

export const VaultFilterPanel: Component<VaultFilterPanelProps> = (props) => {
  const [showTypeDropdown, setShowTypeDropdown] = createSignal(false);

  const handleSelect = (type: VaultItemType | "all") => {
    props.onSelectFilterType(type);
    setShowTypeDropdown(false);
  };

  return (
    <Show when={props.showFilterPanel}>
      <div class="filter-panel">
        <div
          class="filter-dropdown-trigger"
          onClick={() => setShowTypeDropdown(!showTypeDropdown())}
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
              onClick={() => handleSelect("all")}
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
              onClick={() => handleSelect(VaultItemType.Login)}
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
              onClick={() => handleSelect(VaultItemType.Card)}
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
              onClick={() => handleSelect(VaultItemType.Identity)}
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
              onClick={() => handleSelect(VaultItemType.SecureNote)}
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
              onClick={() => handleSelect(VaultItemType.SshKey)}
            >
              <KeyIcon class="item-icon" />
              <span>{t("vault_item_ssh_key")}</span>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};
