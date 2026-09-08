import type { VaultField } from "@gistwarden/domain";
import { CustomFieldType, VaultItemType } from "@gistwarden/domain";
import { copyToClipboardWithMessage } from "@gistwarden/ui";
import {
  type Component,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import Button from "@/components/ui/Button.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { formatDateTime, t } from "@/core/i18n.ts";
import { goBack, navigate, selectItem } from "@/core/navigation.ts";
import { accountStore, uiStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { getVaultItemStrategy } from "@/features/vault/registry/vault-item-registry.ts";
import {
  deleteVaultItemWithConfirm,
  getVaultItemDetailTitle,
} from "@/features/vault/vault-utils.ts";
import { CopyIcon, EyeIcon, EyeOffIcon, TrashIcon } from "@/icons/svg/index.ts";

function formatDetailFieldValue(field: VaultField, isVisible: boolean): string {
  switch (field.type) {
    case CustomFieldType.Hidden:
      return isVisible ? field.value || "" : "••••••••••••";
    case CustomFieldType.Linked:
      return `🔗 ${field.value || ""}`;
    default:
      return field.value || t("detail_no_value");
  }
}

export const ItemDetail: Component = () => {
  // Local view states
  const [notes, setNotes] = createSignal("");
  const [fields, setFields] = createSignal<VaultField[]>([]);
  const [visibleFields, setVisibleFields] = createSignal<
    Record<number, boolean>
  >({});
  const [error, setError] = createSignal("");

  // Populate form states on mount
  onMount(() => {
    const item = uiStore.selectedItem;
    if (!item || !accountStore.vaultItems.some((v) => v.id === item.id)) {
      selectItem(null);
      goBack(View.Vault);
      return;
    }
    setNotes(item.notes || "");
    setFields(item.fields || []);
  });

  const toggleFieldVisibility = (index: number) => {
    setVisibleFields((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopy = async (text: string, _type: string) => {
    await copyToClipboardWithMessage(text, "detail_copied");
  };

  const handleDelete = async () => {
    if (!uiStore.selectedItem?.id) return;
    setError("");
    const success = await deleteVaultItemWithConfirm(uiStore.selectedItem);
    if (!success && uiStore.toastType === "error") {
      setError(uiStore.toastMessage);
    }
  };

  const handleBackToVault = () => {
    selectItem(null);
    goBack(View.Vault);
  };

  const handleGoToEdit = () => {
    navigate(View.ItemEdit);
  };

  return (
    <div class="app-container h-full">
      <div class="detail-form">
        {/* Scrollable Body */}
        <div class="app-body pb-24">
          {/* Header */}
          <DetailHeader
            title={getVaultItemDetailTitle(uiStore.selectedItem?.type)}
            onBack={handleBackToVault}
            showPopout
          />
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          {/* Card Info Name (For all items) */}
          <Show when={uiStore.selectedItem}>
            {(item) => {
              const strategy = getVaultItemStrategy(item().type);

              return (
                <div class="card p-16 mb-16 d-flex align-center gap-12">
                  <div class="item-icon-large">
                    {strategy.renderIcon(item())}
                  </div>
                  <div>
                    <div class="item-name-large">{item().name}</div>
                  </div>
                </div>
              );
            }}
          </Show>

          {/* Render specific component fields */}
          {renderTypeFields()}

          {/* Card 4: Custom Fields */}
          <Show when={fields().length > 0}>
            <div
              class={`detail-section-title ${
                uiStore.selectedItem?.type === VaultItemType.SecureNote
                  ? "mt-0"
                  : "mt-16"
              }`}
            >
              {t("edit_label_fields")}
            </div>
            <div class="card mb-16">
              <For each={fields()}>
                {(field, index) => (
                  <Switch>
                    <Match when={field.type === CustomFieldType.Divider}>
                      <div class="custom-field-divider">
                        <span>{field.name || "Divider"}</span>
                      </div>
                    </Match>
                    <Match when={field.type === CustomFieldType.Boolean}>
                      <div class="detail-row custom-field-row align-items-center">
                        <div class="field-content">
                          <Checkbox
                            id={`detail-cf-bool-${index()}`}
                            checked={
                              field.value === "true" || field.value === "1"
                            }
                            disabled
                            label={field.name || t("edit_label_fields")}
                          />
                        </div>
                      </div>
                    </Match>
                    <Match when={true}>
                      <div class="detail-row custom-field-row">
                        <div class="field-content">
                          <div class="field-label">
                            {field.name || t("edit_label_fields")}
                          </div>
                          <div class="field-value">
                            {formatDetailFieldValue(
                              field,
                              Boolean(visibleFields()[index()]),
                            )}
                          </div>
                        </div>
                        <div class="field-actions">
                          <Show when={field.type === CustomFieldType.Hidden}>
                            <button
                              type="button"
                              class="action-btn"
                              onClick={() => toggleFieldVisibility(index())}
                              title={t("edit_field_val_placeholder")}
                            >
                              <Show
                                when={visibleFields()[index()]}
                                fallback={<EyeIcon class="icon-inline" />}
                              >
                                <EyeOffIcon class="icon-inline" />
                              </Show>
                            </button>
                          </Show>
                          <Show when={field.value}>
                            <button
                              type="button"
                              class="action-btn"
                              onClick={() =>
                                handleCopy(field.value, field.name || "value")
                              }
                              title={t("btn_copy")}
                            >
                              <CopyIcon />
                            </button>
                          </Show>
                        </div>
                      </div>
                    </Match>
                  </Switch>
                )}
              </For>
            </div>
          </Show>

          {/* Card 5: Notes display (Only for Login & Card since Secure Note displays it above) */}
          <Show
            when={
              uiStore.selectedItem?.type !== VaultItemType.SecureNote && notes()
            }
          >
            <div
              class={`detail-section-title ${
                uiStore.selectedItem?.type === VaultItemType.SecureNote &&
                fields().length === 0
                  ? "mt-0"
                  : "mt-16"
              }`}
            >
              {t("edit_label_notes")}
            </div>
            <div class="card mb-16">
              <div class="notes-display">{notes()}</div>
            </div>
          </Show>

          {/* Card 6: Item history */}
          <Show when={uiStore.selectedItem}>
            {(item) => (
              <>
                <div class="detail-section-title mt-16">
                  {t("detail_item_history")}
                </div>
                <div class="card mb-16 p-16 font-sz-12 text-muted">
                  <Show when={item().folderId}>
                    <div class="py-6 d-flex align-center gap-8">
                      <span>{t("vault_item_folder")}:</span>
                      <span class="font-w-500 text-normal">
                        {accountStore.folders.find(
                          (f) => f.id === item().folderId,
                        )?.name || ""}
                      </span>
                    </div>
                  </Show>
                  <div class="py-6 d-flex align-center gap-8">
                    <span>{t("detail_revision_date")}:</span>
                    <span class="font-w-500 text-normal">
                      {formatDateTime(item().revisionDate)}
                    </span>
                  </div>
                  <div class="py-6 d-flex align-center gap-8">
                    <span>{t("detail_creation_date")}:</span>
                    <span class="font-w-500 text-normal">
                      {formatDateTime(item().creationDate)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </Show>
        </div>

        {/* Footer: Sửa và Xóa */}
        <div class="detail-footer-bar">
          <Button type="button" variant="primary" onClick={handleGoToEdit}>
            {t("btn_edit")}
          </Button>
          <button
            type="button"
            class="detail-delete-btn"
            onClick={handleDelete}
            title={t("btn_delete")}
          >
            <TrashIcon class="icon-inline-large" />
          </button>
        </div>
      </div>
    </div>
  );

  function renderTypeFields() {
    if (!uiStore.selectedItem) return null;
    const strategy = getVaultItemStrategy(uiStore.selectedItem.type);
    const DetailComponent = strategy.DetailComponent;
    return <DetailComponent item={uiStore.selectedItem} onCopy={handleCopy} />;
  }
};

export default ItemDetail;
