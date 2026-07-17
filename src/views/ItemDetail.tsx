import { type Component, createSignal, For, onMount, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import {
  type CardVaultItem,
  CustomFieldType,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type VaultField,
  VaultItemType,
} from "@/shared/types.ts";
import Button from "@/components/Button.tsx";
import { CopyIcon, EyeIcon, EyeOffIcon, TrashIcon } from "@/icons/svg/index.ts";
import { formatDateTime, t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";
import LoginDetailFields from "@/components/item-detail/LoginDetailFields.tsx";
import CardDetailFields from "@/components/item-detail/CardDetailFields.tsx";
import NoteDetailFields from "@/components/item-detail/NoteDetailFields.tsx";

export const ItemDetail: Component = () => {
  // Local view states
  const [name, setName] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [fields, setFields] = createSignal<VaultField[]>([]);
  const [visibleFields, setVisibleFields] = createSignal<
    Record<number, boolean>
  >({});
  const [error, setError] = createSignal("");

  // Populate form states on mount
  onMount(() => {
    const item = store.selectedItem;
    if (item) {
      setName(item.name || "");
      setNotes(item.notes || "");
      setFields(item.fields || []);
    }
  });

  const getCardItem = (): CardVaultItem | null => {
    const item = store.selectedItem;
    return item?.type === VaultItemType.Card ? item : null;
  };

  const getLoginItem = (): LoginVaultItem | null => {
    const item = store.selectedItem;
    return item?.type === VaultItemType.Login ? item : null;
  };

  const getNoteItem = (): SecureNoteVaultItem | null => {
    const item = store.selectedItem;
    return item?.type === VaultItemType.SecureNote ? item : null;
  };

  const toggleFieldVisibility = (index: number) => {
    setVisibleFields((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopy = async (text: string, _type: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    storeActions.showToast(t("detail_copied"), "success");
  };

  const handleDelete = async () => {
    if (!store.selectedItem?.id) return;
    if (
      !(await storeActions.confirm(
        t("edit_confirm_delete_title"),
        t("edit_confirm_delete_msg", { name: name() }),
        "danger",
      ))
    ) {
      return;
    }

    setError("");
    const res = await storeActions.deleteItem(store.selectedItem.id);
    if (res.success) {
      storeActions.navigate(View.Vault);
    } else {
      setError(res.error || t("edit_error_delete_failed"));
    }
  };

  const handleBackToVault = () => {
    storeActions.navigate(View.Vault);
  };

  const handleGoToEdit = () => {
    storeActions.navigate(View.ItemEdit);
  };

  return (
    <div class="app-container h-full">
      <div class="detail-form">
        {/* Scrollable Body */}
        <div class="app-body pb-24">
          {/* Header */}
          <DetailHeader
            title={store.selectedItem?.type === VaultItemType.SecureNote
              ? t("detail_title_note")
              : store.selectedItem?.type === VaultItemType.Card
              ? t("detail_title_card")
              : t("detail_title_login")}
            onBack={handleBackToVault}
            showPopout
          />
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          {/* Card Info Name (For non-Card items) */}
          <Show
            when={store.selectedItem &&
              store.selectedItem.type !== VaultItemType.Card}
          >
            <div class="detail-view-header">
              <div class="detail-view-name">
                {name() || t("detail_no_value")}
              </div>
            </div>
          </Show>

          {/* Modular Type-Specific Fields */}
          <Show when={getCardItem()}>
            {(cardItem) => (
              <CardDetailFields
                item={cardItem()}
                onCopy={handleCopy}
              />
            )}
          </Show>
          <Show when={getLoginItem()}>
            {(loginItem) => (
              <LoginDetailFields
                item={loginItem()}
                onCopy={handleCopy}
              />
            )}
          </Show>
          <Show when={getNoteItem()}>
            {(noteItem) => (
              <NoteDetailFields
                item={noteItem()}
              />
            )}
          </Show>

          {/* Card 4: Custom Fields */}
          <Show when={fields().length > 0}>
            <div
              class={`detail-section-title ${
                store.selectedItem?.type === VaultItemType.SecureNote
                  ? "mt-0"
                  : "mt-16"
              }`}
            >
              {t("edit_label_fields")}
            </div>
            <div class="card mb-16">
              <For each={fields()}>
                {(field, index) => (
                  <Show
                    when={field.type === CustomFieldType.Divider}
                    fallback={
                      <div class="detail-row">
                        <div class="field-content">
                          <div class="field-label">
                            {field.name || t("edit_label_fields")}
                          </div>
                          <div class="field-value">
                            {field.type === CustomFieldType.Hidden
                              ? (visibleFields()[index()]
                                ? field.value
                                : "••••••••••••")
                              : field.value || t("detail_no_value")}
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
                                handleCopy(
                                  field.value,
                                  field.name || "value",
                                )}
                              title={t("btn_copy")}
                            >
                              <CopyIcon />
                            </button>
                          </Show>
                        </div>
                      </div>
                    }
                  >
                    {/* Divider row */}
                    <div class="custom-field-divider">
                      <span>{field.name || "Divider"}</span>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </Show>

          {/* Card 5: Notes display (Only for Login & Card since Secure Note displays it above) */}
          <Show
            when={store.selectedItem?.type !== VaultItemType.SecureNote &&
              notes()}
          >
            <div
              class={`detail-section-title ${
                (store.selectedItem?.type === VaultItemType.SecureNote &&
                    fields().length === 0)
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
          <Show when={store.selectedItem}>
            {(item) => (
              <>
                <div class="detail-section-title mt-16">
                  {t("detail_item_history")}
                </div>
                <div class="card mb-16 p-16 font-sz-12 text-muted">
                  <div class="py-4">
                    <span>{t("detail_revision_date")}:</span>
                    <span class="font-w-500 text-normal">
                      {formatDateTime(item().revisionDate)}
                    </span>
                  </div>
                  <div class="py-4 border-top mt-4 pt-4">
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
          <Button
            type="button"
            variant="primary"
            onClick={handleGoToEdit}
          >
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
};
export default ItemDetail;
