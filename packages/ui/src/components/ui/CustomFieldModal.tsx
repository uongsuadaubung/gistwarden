import { createEffect, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import Select from "@/components/ui/Select.tsx";
import BaseSlideModal from "@/components/ui/BaseSlideModal.tsx";
import { CustomFieldType } from "@gistwarden/domain";
import type { VaultField } from "@gistwarden/domain";

interface CustomFieldModalProps {
  isOpen: boolean;
  isEdit: boolean;
  initialField: VaultField | null;
  onClose: () => void;
  onSave: (field: VaultField) => void;
}

export default function CustomFieldModal(props: CustomFieldModalProps) {
  const [name, setName] = createSignal("");
  const [value, setValue] = createSignal("");
  const [type, setType] = createSignal<CustomFieldType>(CustomFieldType.Text);

  const fieldTypeOptions = () => [
    { value: CustomFieldType.Text, label: t("edit_field_type_text") },
    { value: CustomFieldType.Hidden, label: t("edit_field_type_hidden") },
    { value: CustomFieldType.Boolean, label: t("edit_field_type_boolean") },
    { value: CustomFieldType.Linked, label: t("edit_field_type_linked") },
    { value: CustomFieldType.Divider, label: t("edit_field_type_divider") },
  ];

  createEffect(() => {
    if (props.isOpen) {
      if (props.initialField) {
        setName(props.initialField.name || "");
        setValue(props.initialField.value || "");
        setType(props.initialField.type ?? CustomFieldType.Text);
      } else {
        setName("");
        setValue("");
        setType(CustomFieldType.Text);
      }
    }
  });

  return (
    <BaseSlideModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.isEdit
        ? t("edit_field_modal_title_edit")
        : t("edit_field_modal_title_add")}
    >
      {(triggerClose) => {
        const handleSave = () => {
          const trimmedName = name().trim();
          if (!trimmedName) {
            alert(
              type() === CustomFieldType.Divider
                ? t("edit_field_error_empty_divider")
                : t("edit_field_error_empty_name"),
            );
            return;
          }

          triggerClose(() => {
            props.onSave({
              name: trimmedName,
              value: type() === CustomFieldType.Divider ? "" : value().trim(),
              type: type(),
            });
          });
        };

        return (
          <>
            <div class="modal-panel-body">
              <div class="form-group">
                <label>{t("edit_field_modal_label_type")}</label>
                <Select
                  value={type()}
                  onChange={(e) => {
                    const val = parseInt(e.currentTarget.value);
                    if (
                      val === CustomFieldType.Text ||
                      val === CustomFieldType.Hidden ||
                      val === CustomFieldType.Boolean ||
                      val === CustomFieldType.Linked ||
                      val === CustomFieldType.Divider
                    ) {
                      setType(val);
                    }
                  }}
                  options={fieldTypeOptions()}
                />
              </div>

              <div class="form-group">
                <label>{t("edit_field_name_placeholder")}</label>
                <Input
                  type="text"
                  placeholder={type() === CustomFieldType.Divider
                    ? t("edit_field_modal_placeholder_divider")
                    : t("edit_field_modal_placeholder_name")}
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                />
              </div>

              <Show when={type() !== CustomFieldType.Divider}>
                <div class="form-group">
                  <label>{t("edit_field_val_placeholder")}</label>
                  <Input
                    type={type() === CustomFieldType.Hidden
                      ? "password"
                      : "text"}
                    placeholder={t("edit_field_val_placeholder") + "..."}
                    value={value()}
                    onInput={(e) => setValue(e.currentTarget.value)}
                  />
                </div>
              </Show>
            </div>

            <div class="modal-panel-footer">
              <Button type="button" variant="primary" onClick={handleSave}>
                {props.isEdit ? t("btn_save") : t("btn_create")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => triggerClose()}
              >
                {t("btn_cancel")}
              </Button>
            </div>
          </>
        );
      }}
    </BaseSlideModal>
  );
}
