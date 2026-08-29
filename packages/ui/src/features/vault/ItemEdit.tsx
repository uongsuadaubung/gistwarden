import {
  asFolderId,
  type Fido2CredentialId,
  getVaultItemFallbackName,
  VaultItemType,
} from "@gistwarden/domain";
import { confirm, setGlobalLoading, showToast } from "@gistwarden/ui";
import type { Result } from "neverthrow";
import { type Component, createSignal, onMount, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import Button from "@/components/ui/Button.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import GuideHelpButton from "@/components/ui/GuideHelpButton.tsx";
import Input from "@/components/ui/Input.tsx";
import Select from "@/components/ui/Select.tsx";
import { getHostname, safeParseUrl } from "@/core/domain-utils.ts";
import { type TranslationKey, t } from "@/core/i18n.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { accountStore, uiStore } from "@/core/store.ts";
import { captureVisibleTab, getCurrentTab } from "@/core/tabs.ts";
import { safeDecodeQr } from "@/core/totp-utils.ts";
import { View } from "@/core/types.ts";
import CustomFieldsEdit from "@/features/vault/item-edit/CustomFieldsEdit.tsx";
import {
  getInitialFormState,
  type ItemEditFormState,
  mapFormStateToVaultItem,
} from "@/features/vault/item-edit/vault-edit-helper.ts";
import { getVaultItemStrategy } from "@/features/vault/registry/vault-item-registry.ts";
import { createItem, updateItem } from "@/features/vault/vault-service.ts";
import {
  deleteVaultItemWithConfirm,
  getVaultItemTitle,
  getVaultItemToastMsg,
} from "@/features/vault/vault-utils.ts";
import { TrashIcon } from "@/icons/svg/index.ts";

const ITEM_NAME_PLACEHOLDERS: Record<VaultItemType, () => string> = {
  [VaultItemType.Login]: () => t("edit_placeholder_name_login"),
  [VaultItemType.SecureNote]: () => t("edit_placeholder_name_note"),
  [VaultItemType.Card]: () => "e.g. Visa, Mastercard...",
  [VaultItemType.Identity]: () => t("edit_placeholder_name_login"),
  [VaultItemType.SshKey]: () => t("edit_placeholder_name_login"),
};

function getItemNamePlaceholder(itemType: VaultItemType): string {
  const getPlaceholder =
    ITEM_NAME_PLACEHOLDERS[itemType] ??
    ITEM_NAME_PLACEHOLDERS[VaultItemType.Login];
  return getPlaceholder();
}

export const ItemEdit: Component = () => {
  const isEdit = () => {
    const id = uiStore.selectedItem?.id;
    if (!id) return false;
    return accountStore.vaultItems.some((item) => item.id === id);
  };

  const [formState, setFormState] = createStore<ItemEditFormState>(
    getInitialFormState(uiStore.selectedItem),
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

  onMount(async () => {
    const item = uiStore.selectedItem;
    if (item) {
      setFormState(reconcile(getInitialFormState(item)));
    }

    if (!isEdit()) {
      const tabRes = await getCurrentTab();
      if (tabRes.isOk() && tabRes.value?.url) {
        const url = tabRes.value.url;
        const isRestrictedUrl =
          url.startsWith("chrome://") ||
          url.startsWith("chrome-extension://") ||
          url.startsWith("about:") ||
          url.startsWith("edge://") ||
          url.startsWith("devtools://") ||
          url.startsWith("chrome-search://") ||
          url.startsWith("view-source:");

        if (!isRestrictedUrl) {
          if (formState.itemType === VaultItemType.Login) {
            const hasExistingUris = formState.uris.some(
              (u) => u.uri && u.uri.trim() !== "",
            );
            if (!hasExistingUris) {
              updateForm("uris", [{ uri: url }]);
            }
          }

          const fallbackName = getVaultItemFallbackName(formState.itemType);
          const currentName = formState.name.trim();
          const shouldUpdateName = !currentName || currentName === fallbackName;

          if (shouldUpdateName) {
            const hostname = getHostname(url);
            if (hostname) {
              updateForm("name", hostname);
            }
          }
        }
      }
    }
  });

  const handleScanQr = async () => {
    setScanning(true);
    setError("");

    // 1. Capture the visible tab as a PNG data URL
    const screenshotRes = await captureVisibleTab({ format: "png" });
    if (screenshotRes.isErr()) {
      setError(t("edit_qr_error_fail"));
      setScanning(false);
      return;
    }
    const screenshot = screenshotRes.value;

    // 2. Decode using qrcode-parser
    const scanRes = await safeDecodeQr(screenshot);

    if (scanRes.isErr()) {
      setError(t(scanRes.error));
      setScanning(false);
      return;
    }
    const decodedStr = scanRes.value;
    console.debug("[Popup] Decoded QR Code URL:", decodedStr);

    // 3. Parse OTPAuth URL
    const urlRes = safeParseUrl(decodedStr);
    if (urlRes.isOk()) {
      const url = urlRes.value;
      if (url.protocol === "otpauth:" && url.searchParams.has("secret")) {
        updateForm("totpSecret", decodedStr); // Lưu toàn bộ URL để đồng bộ với định dạng cũ và Bitwarden
        showToast(t("edit_qr_success"), "success");
      } else {
        setError(t("edit_qr_error_no_match"));
      }
    } else {
      setError(t("edit_qr_error_no_match"));
    }
    setScanning(false);
  };

  const handleDelete = async () => {
    if (!isEdit() || !uiStore.selectedItem) return;
    setError("");
    const success = await deleteVaultItemWithConfirm(uiStore.selectedItem);
    if (!success && uiStore.toastType === "error") {
      setError(uiStore.toastMessage);
    }
  };

  const handleDeleteFidoCredential = async (credId: Fido2CredentialId) => {
    if (
      !(await confirm(
        t("edit_confirm_delete_passkey_title"),
        t("edit_confirm_delete_passkey_msg"),
        "danger",
      ))
    )
      return;
    updateForm(
      "fidoCredentials",
      (formState.fidoCredentials || []).filter(
        (c) => c.credentialId !== credId,
      ),
    );
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setError(t("edit_error_empty_name"));
      return;
    }

    setError("");

    setGlobalLoading(true);
    const itemData = mapFormStateToVaultItem(formState, uiStore.selectedItem);
    const editing = isEdit();
    let res: Result<void, TranslationKey>;

    if (editing) {
      const id = uiStore.selectedItem?.id;
      if (!id) {
        setGlobalLoading(false);
        return;
      }
      res = await updateItem(id, itemData);
    } else {
      res = await createItem(itemData);
    }
    setGlobalLoading(false);
    if (res.isOk()) {
      const msg = getVaultItemToastMsg(formState.itemType, editing);
      showToast(msg, "success");

      // If was editing, return to detail view, else go back to vault
      if (editing) {
        // Update selectedItem locally so the detail view shows updated content immediately
        const savedItem = accountStore.vaultItems.find(
          (v) => v.id === uiStore.selectedItem?.id,
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
      setError(t(res.error));
    }
  };

  const handleCancel = () => {
    if (isEdit()) {
      navigate(View.ItemDetail);
    } else {
      selectItem(null);
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
            title={getVaultItemTitle(formState.itemType, isEdit())}
            onBack={handleCancel}
          />
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          <div class="detail-section-title mt-0">
            {t("edit_section_item_details")}
          </div>
          <div class="card mb-16 overflow-visible">
            <div class="form-group">
              <label for="item-name">{t("edit_label_name")}</label>
              <Input
                id="item-name"
                type="text"
                value={formState.name}
                onInput={(e) => updateForm("name", e.currentTarget.value)}
                placeholder={getItemNamePlaceholder(formState.itemType)}
              />
            </div>

            <Show when={(accountStore.folders || []).length > 0}>
              <div class="form-group mt-12">
                <label for="item-folder">{t("folder_select_label")}</label>
                <Select
                  id="item-folder"
                  value={formState.folderId || ""}
                  onChange={(e) =>
                    updateForm(
                      "folderId",
                      e.currentTarget.value
                        ? asFolderId(e.currentTarget.value)
                        : null,
                    )
                  }
                  options={[
                    { value: "", label: t("folder_no_folder_option") },
                    ...(accountStore.folders || []).map((f) => ({
                      value: f.id,
                      label: f.name,
                    })),
                  ]}
                />
              </div>
            </Show>
          </div>

          {(() => {
            const strategy = getVaultItemStrategy(formState.itemType);
            const EditComponent = strategy.EditComponent;
            return (
              <EditComponent
                formState={formState}
                updateForm={updateForm}
                onDeleteFido={handleDeleteFidoCredential}
                scanning={scanning()}
                onScanQr={handleScanQr}
              />
            );
          })()}

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
                    updateForm("reprompt", checked ? 1 : 0)
                  }
                  label={t("edit_label_reprompt")}
                  suffix={<GuideHelpButton route="vault-management/logins" />}
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
            <Button type="submit" variant="primary">
              {isEdit() ? t("btn_save") : t("btn_create")}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              {t("btn_cancel")}
            </Button>
          </div>

          <Show when={isEdit()}>
            <button
              type="button"
              class="detail-delete-btn"
              onClick={handleDelete}
              title={t("btn_delete")}
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
