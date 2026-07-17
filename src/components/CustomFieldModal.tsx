import { createEffect, createSignal, Show } from "solid-js";
import { t } from "../shared/i18n.ts";
import Input from "./Input.tsx";
import Button from "./Button.tsx";
import { CustomFieldType, type VaultField } from "../shared/types.ts";

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
  const [isClosing, setIsClosing] = createSignal(false);

  createEffect(() => {
    if (props.isOpen) {
      setIsClosing(false);
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

  const triggerClose = () => {
    if (isClosing()) return;
    setIsClosing(true);
    setTimeout(() => {
      props.onClose();
    }, 250); // Matches the slideDown/fadeOut animation duration (0.25s)
  };

  const handleSave = () => {
    if (isClosing()) return;
    const trimmedName = name().trim();
    if (!trimmedName) {
      alert(
        type() === CustomFieldType.Divider
          ? t("edit_field_error_empty_divider")
          : t("edit_field_error_empty_name"),
      );
      return;
    }

    setIsClosing(true);
    setTimeout(() => {
      props.onSave({
        name: trimmedName,
        value: type() === CustomFieldType.Divider ? "" : value().trim(),
        type: type(),
      });
    }, 250);
  };

  return (
    <Show when={props.isOpen}>
      <div
        class={`modal-overlay bottom-slide ${isClosing() ? "is-closing" : ""}`}
        onClick={triggerClose}
      >
        <div class="modal-slide-panel" onClick={(e) => e.stopPropagation()}>
          <div class="modal-panel-header">
            <div class="modal-panel-title">
              {props.isEdit
                ? t("edit_field_modal_title_edit")
                : t("edit_field_modal_title_add")}
            </div>
            <button
              type="button"
              class="modal-close-btn"
              onClick={triggerClose}
            >
              &times;
            </button>
          </div>

          <div class="modal-panel-body">
            <div class="form-group">
              <label>{t("edit_field_modal_label_type")}</label>
              <select
                class="input-control"
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
              >
                <option value={CustomFieldType.Text}>
                  {t("edit_field_type_text")}
                </option>
                <option value={CustomFieldType.Hidden}>
                  {t("edit_field_type_hidden")}
                </option>
                <option value={CustomFieldType.Boolean}>
                  {t("edit_field_type_boolean")}
                </option>
                <option value={CustomFieldType.Linked}>
                  {t("edit_field_type_linked")}
                </option>
                <option value={CustomFieldType.Divider}>
                  {t("edit_field_type_divider")}
                </option>
              </select>
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
                  type={type() === CustomFieldType.Hidden ? "password" : "text"}
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
            <Button type="button" variant="secondary" onClick={triggerClose}>
              {t("btn_cancel")}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
}
