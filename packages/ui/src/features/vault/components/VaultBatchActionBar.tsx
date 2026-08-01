import { type Component, Show } from "solid-js";
import { CloseIcon, FolderIcon, TrashIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";

export interface VaultBatchActionBarProps {
  selectedCount: number;
  allVisibleCount: number;
  foldersCount: number;
  onToggleSelectMode: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onMoveToFolder: () => void;
}

export const VaultBatchActionBar: Component<VaultBatchActionBarProps> = (
  props,
) => {
  return (
    <div class="select-action-row">
      <div class="select-info">
        <button
          type="button"
          class="action-icon-btn exit-select-btn"
          onClick={props.onToggleSelectMode}
          title={t("btn_close")}
        >
          <CloseIcon />
        </button>
        <span class="selected-count-badge">
          {t("vault_selected_count", {
            count: props.selectedCount,
          })}
        </span>
      </div>
      <div class="select-actions-group">
        <button
          type="button"
          class="btn-select-all"
          onClick={props.onSelectAll}
        >
          {props.selectedCount >= props.allVisibleCount &&
              props.allVisibleCount > 0
            ? t("vault_deselect_all")
            : t("vault_select_all")}
        </button>
        <Show when={props.foldersCount > 0}>
          <button
            type="button"
            class="btn-bulk-move"
            disabled={props.selectedCount === 0}
            onClick={props.onMoveToFolder}
            title={t("vault_btn_move_to_folder")}
          >
            <FolderIcon class="btn-icon" />
            <span>{t("vault_btn_move_to_folder")}</span>
          </button>
        </Show>
        <button
          type="button"
          class="btn-bulk-delete"
          disabled={props.selectedCount === 0}
          onClick={props.onDeleteSelected}
          title={t("vault_btn_delete_selected")}
        >
          <TrashIcon class="btn-icon" />
          <span>{t("btn_delete")}</span>
        </button>
      </div>
    </div>
  );
};
