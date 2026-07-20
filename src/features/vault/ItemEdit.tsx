import { type Component, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { store } from "@/core/store.ts";
import { VaultItemType, View } from "@/core/types.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { deleteItem, saveItem } from "@/features/vault/vault-service.ts";
import { confirm, showToast } from "@/core/ui-service.ts";
import Button from "@/components/ui/Button.tsx";
import Input from "@/components/ui/Input.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import { TrashIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import LoginEditFields from "@/features/vault/item-edit/LoginEditFields.tsx";
import CardEditFields from "@/features/vault/item-edit/CardEditFields.tsx";
import NoteEditFields from "@/features/vault/item-edit/NoteEditFields.tsx";
import IdentityEditFields from "@/features/vault/item-edit/IdentityEditFields.tsx";
import SshKeyEditFields from "@/features/vault/item-edit/SshKeyEditFields.tsx";
import qrcodeParser from "qrcode-parser";
import {
  getInitialFormState,
  type ItemEditFormState,
  mapFormStateToVaultItem,
} from "@/features/vault/item-edit/vault-edit-helper.ts";
import CustomFieldsEdit from "@/features/vault/item-edit/CustomFieldsEdit.tsx";

export const ItemEdit: Component = () => {
  const isEdit = () => !!store.selectedItem?.id;

  const [formState, setFormState] = createStore<ItemEditFormState>(
    getInitialFormState(),
  );

  const updateForm = <K extends keyof ItemEditFormState>(
    key: K,
    value: ItemEditFormState[K],
  ) => {
    setFormState(key, value);
  };

  // UI state
  const [scanning, setScanning] = createSignal(false);
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  onMount(() => {
    const item = store.selectedItem;
    setFormState(getInitialFormState(item));
  });

  const handleScanQr = async () => {
    setScanning(true);
    setError("");
    try {
      // 1. Capture the visible tab as a PNG data URL
      const screenshot = await chrome.tabs.captureVisibleTab({ format: "png" });
      if (!screenshot) {
        setError(t("edit_qr_error_fail"));
        return;
      }

      // 2. Decode using qrcode-parser
      const decodedStr = await qrcodeParser(screenshot);
      console.debug("[Popup] Decoded QR Code URL:", decodedStr);

      // 3. Parse OTPAuth URL
      try {
        const url = new URL(decodedStr);
        if (url.protocol === "otpauth:" && url.searchParams.has("secret")) {
          updateForm("totpSecret", decodedStr); // Lưu toàn bộ URL để đồng bộ với định dạng cũ và Bitwarden
          showToast(t("edit_qr_success"), "success");
        } else {
          setError(t("edit_qr_error_no_match"));
        }
      } catch (_e) {
        setError(t("edit_qr_error_no_match"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || t("edit_qr_error_fail"));
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async () => {
    if (!store.selectedItem?.id) return;
    if (
      !(await confirm(
        t("edit_confirm_delete_title"),
        t("edit_confirm_delete_msg", { name: formState.name }),
        "danger",
      ))
    ) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await deleteItem(store.selectedItem.id);
      if (res.success) {
        navigate(View.Vault);
      } else {
        setError(res.error || t("edit_error_delete_failed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFidoCredential = async (credId: string) => {
    if (
      !(await confirm(
        t("edit_confirm_delete_passkey_title"),
        t("edit_confirm_delete_passkey_msg"),
        "danger",
      ))
    ) return;
    updateForm(
      "fidoCredentials",
      (formState.fidoCredentials || []).filter((c) =>
        c.credentialId !== credId
      ),
    );
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (saving()) return;
    if (!formState.name.trim()) {
      setError(t("edit_error_empty_name"));
      return;
    }

    setError("");
    setSaving(true);

    try {
      const itemData = mapFormStateToVaultItem(formState, store.selectedItem);
      const res = await saveItem(itemData);
      if (res.success) {
        const msg = isEdit()
          ? (formState.itemType === VaultItemType.SecureNote
            ? t("edit_toast_updated_note")
            : formState.itemType === VaultItemType.Card
            ? t("edit_toast_updated_card")
            : formState.itemType === VaultItemType.Identity
            ? t("edit_toast_updated_identity")
            : formState.itemType === VaultItemType.SshKey
            ? t("edit_toast_updated_ssh_key")
            : t("edit_toast_updated_login"))
          : (formState.itemType === VaultItemType.SecureNote
            ? t("edit_toast_created_note")
            : formState.itemType === VaultItemType.Card
            ? t("edit_toast_created_card")
            : formState.itemType === VaultItemType.Identity
            ? t("edit_toast_created_identity")
            : formState.itemType === VaultItemType.SshKey
            ? t("edit_toast_created_ssh_key")
            : t("edit_toast_created_login"));
        showToast(msg, "success");

        // If was editing, return to detail view, else go back to vault
        if (isEdit()) {
          // Update selectedItem locally so the detail view shows updated content immediately
          const savedItem = store.vaultItems.find((v) =>
            v.id === store.selectedItem?.id
          );
          if (savedItem) {
            selectItem(savedItem);
          } else {
            navigate(View.Vault);
          }
        } else {
          navigate(View.Vault);
        }
      } else {
        setError(res.error || t("edit_error_save_failed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEdit()) {
      navigate(View.ItemDetail);
    } else {
      navigate(View.Vault);
    }
  };

  return (
    <div class="app-container h-full">
      <form onSubmit={handleSave} class="detail-form">
        {/* Scrollable Form Body */}
        <div class="app-body pb-24">
          {/* Header */}
          <DetailHeader
            title={isEdit()
              ? (formState.itemType === VaultItemType.SecureNote
                ? t("edit_title_edit_note")
                : formState.itemType === VaultItemType.Card
                ? t("edit_title_edit_card")
                : formState.itemType === VaultItemType.Identity
                ? t("edit_title_edit_identity")
                : formState.itemType === VaultItemType.SshKey
                ? t("edit_title_edit_ssh_key")
                : t("edit_title_edit_login"))
              : (formState.itemType === VaultItemType.SecureNote
                ? t("edit_title_add_note")
                : formState.itemType === VaultItemType.Card
                ? t("edit_title_add_card")
                : formState.itemType === VaultItemType.Identity
                ? t("edit_title_add_identity")
                : formState.itemType === VaultItemType.SshKey
                ? t("edit_title_add_ssh_key")
                : t("edit_title_add_login"))}
            onBack={handleCancel}
          />
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          <div class="detail-section-title mt-0">
            {t("edit_section_item_details")}
          </div>
          <div class="card mb-16">
            <div class="form-group">
              <label for="item-name">{t("edit_label_name")}</label>
              <Input
                id="item-name"
                type="text"
                value={formState.name}
                onInput={(e) => updateForm("name", e.currentTarget.value)}
                placeholder={formState.itemType === VaultItemType.SecureNote
                  ? t("edit_placeholder_name_note")
                  : formState.itemType === VaultItemType.Card
                  ? "e.g. Visa, Mastercard..."
                  : t("edit_placeholder_name_login")}
              />
            </div>
          </div>

          <Show when={formState.itemType === VaultItemType.Login}>
            <LoginEditFields
              formState={formState}
              updateForm={updateForm}
              onDeleteFido={handleDeleteFidoCredential}
              scanning={scanning()}
              onScanQr={handleScanQr}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.Card}>
            <CardEditFields
              formState={formState}
              updateForm={updateForm}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.SecureNote}>
            <NoteEditFields
              formState={formState}
              updateForm={updateForm}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.Identity}>
            <IdentityEditFields
              formState={formState}
              updateForm={updateForm}
            />
          </Show>

          <Show when={formState.itemType === VaultItemType.SshKey}>
            <SshKeyEditFields
              formState={formState}
              updateForm={updateForm}
            />
          </Show>

          {/* Notes Section (Common to Login and Card) */}
          <Show when={formState.itemType !== VaultItemType.SecureNote}>
            <div class="detail-section-title">
              {t("edit_section_additional_options")}
            </div>
            <div class="card mb-16">
              <div class="form-group">
                <label for="item-notes">{t("edit_label_notes")}</label>
                <textarea
                  id="item-notes"
                  class="input-control resize-none"
                  value={formState.notes}
                  onInput={(e) => updateForm("notes", e.currentTarget.value)}
                  placeholder={t("edit_placeholder_notes")}
                  rows="5"
                />
              </div>
              <div class="form-group mt-12">
                <Checkbox
                  id="item-reprompt"
                  checked={formState.reprompt === 1}
                  onChange={(checked) =>
                    updateForm("reprompt", checked ? 1 : 0)}
                  label={t("edit_label_reprompt")}
                />
              </div>
            </div>
          </Show>

          {/* Custom Fields in Edit Mode */}
          <CustomFieldsEdit
            fields={formState.fields}
            onChange={(fs) => updateForm("fields", fs)}
          />
        </div>

        {/* Footer */}
        <div class="detail-footer-bar">
          <div class="d-flex gap-8">
            <Button
              type="submit"
              variant="primary"
              loading={saving()}
              loadingText={t("dialog_loading")}
            >
              <Show
                when={saving()}
                fallback={store.selectedItem?.id
                  ? t("btn_save")
                  : t("btn_create")}
              >
                {t("dialog_loading")}
              </Show>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={saving()}
            >
              {t("btn_cancel")}
            </Button>
          </div>

          <Show when={isEdit()}>
            <button
              type="button"
              class="detail-delete-btn"
              onClick={handleDelete}
              title={t("btn_delete")}
              disabled={saving()}
            >
              <TrashIcon class="icon-inline-large" />
            </button>
          </Show>
        </div>
      </form>
    </div>
  );
};
export default ItemEdit;
