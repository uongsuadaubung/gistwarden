import { createEffect, createSignal, Show } from "solid-js";
import { type Folder } from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";
import { confirm } from "@gistwarden/ui";
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import BaseSlideModal from "@/components/ui/BaseSlideModal.tsx";
import { TrashIcon } from "@/icons/svg/index.ts";

export interface FolderModalProps {
  isOpen: boolean;
  folder?: Folder | null;
  onClose: () => void;
  onSave: (name: string) => Promise<boolean>;
  onDelete?: (folderId: string) => Promise<boolean>;
}

export default function FolderModal(props: FolderModalProps) {
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal("");

  createEffect(() => {
    if (props.isOpen) {
      setName(props.folder?.name || "");
      setError("");
    }
  });

  return (
    <BaseSlideModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      usePortal
      title={props.folder ? t("folder_edit_title") : t("folder_new_title")}
    >
      {(triggerClose) => {
        const handleSubmit = async (e: Event) => {
          e.preventDefault();
          setError("");

          const value = name().trim();
          if (!value) {
            setError(t("folder_error_empty_name"));
            return;
          }

          const success = await props.onSave(value);
          if (success) {
            triggerClose();
          }
        };

        const handleDelete = async () => {
          if (!props.folder || !props.onDelete) return;
          if (
            await confirm(
              t("folder_confirm_delete_title"),
              t("folder_confirm_delete_msg"),
              "danger",
            )
          ) {
            const success = await props.onDelete(props.folder.id);
            if (success) {
              triggerClose();
            }
          }
        };

        return (
          <form onSubmit={handleSubmit} class="modal-panel-body">
            <Show when={error()}>
              <div class="alert alert-danger m-0">{error()}</div>
            </Show>

            <div class="form-group pos-relative">
              <label for="folder-name-input">
                {t("folder_name_label")} <span class="text-error">*</span>
              </label>
              <div class="pos-relative d-flex align-items-center">
                <Input
                  id="folder-name-input"
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder={t("folder_name_placeholder")}
                  class="w-100"
                  autofocus
                  required
                />
              </div>
            </div>

            <div class="modal-panel-footer p-0 border-none d-flex justify-content-between align-items-center w-100">
              <div class="d-flex gap-8">
                <Button type="submit" variant="primary">
                  {t("btn_save")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => triggerClose()}
                >
                  {t("btn_cancel")}
                </Button>
              </div>
              <Show when={props.folder && props.onDelete}>
                <button
                  type="button"
                  class="delete-folder-btn"
                  onClick={handleDelete}
                  title={t("btn_delete")}
                >
                  <TrashIcon class="icon-inline" />
                </button>
              </Show>
            </div>
          </form>
        );
      }}
    </BaseSlideModal>
  );
}
