import { type Component, createSignal, For, onMount, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import {
  type CardVaultItem,
  CustomFieldType,
  type Fido2Credential,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type VaultField,
  VaultItemType,
} from "@/shared/types.ts";
import Button from "@/components/Button.tsx";
import Input from "@/components/Input.tsx";
import Checkbox from "@/components/Checkbox.tsx";
import CustomFieldModal from "@/components/CustomFieldModal.tsx";
import { DragIcon, EditIcon, TrashIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";
import LoginEditFields from "@/components/item-edit/LoginEditFields.tsx";
import CardEditFields from "@/components/item-edit/CardEditFields.tsx";
import NoteEditFields from "@/components/item-edit/NoteEditFields.tsx";
import qrcodeParser from "qrcode-parser";

export const ItemEdit: Component = () => {
  const isEdit = () => !!store.selectedItem?.id;

  // Local form states
  const [name, setName] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [uri, setUri] = createSignal("");
  const [totpSecret, setTotpSecret] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [favorite, setFavorite] = createSignal(false);
  const [reprompt, setReprompt] = createSignal(0);
  const [fidoCredentials, setFidoCredentials] = createSignal<Fido2Credential[]>(
    [],
  );
  const [fields, setFields] = createSignal<VaultField[]>([]);

  // UI state
  const [scanning, setScanning] = createSignal(false);
  const [error, setError] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  const [showEditFieldModal, setShowEditFieldModal] = createSignal(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = createSignal<
    number | null
  >(null);

  const initialField = () => {
    const idx = selectedFieldIndex();
    return idx === null ? null : fields()[idx];
  };

  const handleOpenAddField = () => {
    setSelectedFieldIndex(null);
    setShowEditFieldModal(true);
  };

  const handleOpenEditField = (index: number) => {
    setSelectedFieldIndex(index);
    setShowEditFieldModal(true);
  };

  const handleSaveFieldEdit = (
    field: { name: string; value: string; type: number },
  ) => {
    const idx = selectedFieldIndex();
    if (idx === null) {
      setFields([...fields(), field]);
    } else {
      setFields(fields().map((f, i) => (i === idx ? field : f)));
    }
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  const handleCloseFieldModal = () => {
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);

  const [itemType, setItemType] = createSignal<VaultItemType>(
    VaultItemType.Login,
  );

  // Card specific fields
  const [cardholderName, setCardholderName] = createSignal("");
  const [cardNumber, setCardNumber] = createSignal("");
  const [cardBrand, setCardBrand] = createSignal("Visa");
  const [cardExpMonth, setCardExpMonth] = createSignal("1");
  const [cardExpYear, setCardExpYear] = createSignal(
    String(new Date().getFullYear()),
  );
  const [cardCode, setCardCode] = createSignal("");

  onMount(() => {
    const item = store.selectedItem;
    if (item) {
      setName(item.name || "");
      setItemType(item.type || VaultItemType.Login);
      if (item.type === VaultItemType.SecureNote) {
        setUsername("");
        setPassword("");
        setUri("");
        setTotpSecret("");
        setFidoCredentials([]);

        setCardholderName("");
        setCardNumber("");
        setCardBrand("Visa");
        setCardExpMonth("1");
        setCardExpYear(String(new Date().getFullYear()));
        setCardCode("");
      } else if (item.type === VaultItemType.Card) {
        setUsername("");
        setPassword("");
        setUri("");
        setTotpSecret("");
        setFidoCredentials([]);

        setCardholderName(item.card.cardholderName || "");
        setCardNumber(item.card.number || "");
        setCardBrand(item.card.brand || "Visa");
        setCardExpMonth(item.card.expMonth || "1");
        setCardExpYear(item.card.expYear || String(new Date().getFullYear()));
        setCardCode(item.card.code || "");
      } else {
        setUsername(item.login.username || "");
        setPassword(item.login.password || "");
        setUri(item.login.uris?.[0]?.uri || "");
        setTotpSecret(item.login.totp || "");
        setFidoCredentials(item.login.fido2Credentials || []);

        setCardholderName("");
        setCardNumber("");
        setCardBrand("Visa");
        setCardExpMonth("1");
        setCardExpYear(String(new Date().getFullYear()));
        setCardCode("");
      }
      setNotes(item.notes || "");
      setFavorite(item.favorite || false);
      setReprompt(item.reprompt || 0);
      setFields(item.fields || []);
    } else {
      setItemType(VaultItemType.Login);
      setFields([]);
      setCardholderName("");
      setCardNumber("");
      setCardBrand("Visa");
      setCardExpMonth("1");
      setCardExpYear(String(new Date().getFullYear()));
      setCardCode("");
      setReprompt(0);
    }
  });

  const handleDragStart = (index: number, e: DragEvent) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault();
    const dragged = draggedIndex();
    if (dragged === null || dragged === index) return;

    const list = [...fields()];
    const [moved] = list.splice(dragged, 1);
    list.splice(index, 0, moved);
    setFields(list);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields().filter((_, i) => i !== index));
  };

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
          setTotpSecret(decodedStr); // Lưu toàn bộ URL để đồng bộ với định dạng cũ và Bitwarden
          storeActions.showToast(t("edit_qr_success"), "success");
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
      !(await storeActions.confirm(
        t("edit_confirm_delete_title"),
        t("edit_confirm_delete_msg", { name: name() }),
        "danger",
      ))
    ) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await storeActions.deleteItem(store.selectedItem.id);
      if (res.success) {
        storeActions.navigate(View.Vault);
      } else {
        setError(res.error || t("edit_error_delete_failed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFidoCredential = async (credId: string) => {
    if (
      !(await storeActions.confirm(
        t("edit_confirm_delete_passkey_title"),
        t("edit_confirm_delete_passkey_msg"),
        "danger",
      ))
    ) return;
    setFidoCredentials(
      fidoCredentials().filter((c) => c.credentialId !== credId),
    );
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    if (saving()) return;
    if (!name().trim()) {
      setError(t("edit_error_empty_name"));
      return;
    }

    setError("");
    setSaving(true);

    try {
      let itemData:
        | Partial<LoginVaultItem>
        | Partial<SecureNoteVaultItem>
        | Partial<CardVaultItem>;

      if (itemType() === VaultItemType.SecureNote) {
        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.SecureNote,
          name: name().trim(),
          notes: notes().trim(),
          favorite: favorite(),
          reprompt: reprompt(),
          fields: fields().map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
        };
      } else if (itemType() === VaultItemType.Card) {
        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.Card,
          name: name().trim(),
          notes: notes().trim(),
          favorite: favorite(),
          reprompt: reprompt(),
          fields: fields().map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
          card: {
            cardholderName: cardholderName().trim(),
            brand: cardBrand(),
            number: cardNumber().trim(),
            expMonth: cardExpMonth(),
            expYear: cardExpYear().trim(),
            code: cardCode().trim(),
          },
        };
      } else {
        itemData = {
          id: store.selectedItem?.id || undefined,
          type: VaultItemType.Login,
          name: name().trim(),
          notes: notes().trim(),
          favorite: favorite(),
          reprompt: reprompt(),
          fields: fields().map((f) => ({
            type: f.type,
            name: f.name.trim(),
            value: f.value.trim(),
          })),
          login: {
            username: username().trim(),
            password: password().trim(),
            totp: totpSecret().trim(),
            uris: uri().trim() ? [{ uri: uri().trim() }] : [],
            fido2Credentials: fidoCredentials(),
          },
        };
      }

      const res = await storeActions.saveItem(itemData);
      if (res.success) {
        const msg = isEdit()
          ? (itemType() === VaultItemType.SecureNote
            ? t("edit_toast_updated_note")
            : itemType() === VaultItemType.Card
            ? t("edit_toast_updated_card")
            : t("edit_toast_updated_login"))
          : (itemType() === VaultItemType.SecureNote
            ? t("edit_toast_created_note")
            : itemType() === VaultItemType.Card
            ? t("edit_toast_created_card")
            : t("edit_toast_created_login"));
        storeActions.showToast(msg, "success");

        // If was editing, return to detail view, else go back to vault
        if (isEdit()) {
          // Update selectedItem locally so the detail view shows updated content immediately
          const savedItem = store.vaultItems.find((v) =>
            v.id === store.selectedItem?.id
          );
          if (savedItem) {
            storeActions.selectItem(savedItem);
          } else {
            storeActions.navigate(View.Vault);
          }
        } else {
          storeActions.navigate(View.Vault);
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
      storeActions.navigate(View.ItemDetail);
    } else {
      storeActions.navigate(View.Vault);
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
              ? (itemType() === VaultItemType.SecureNote
                ? t("edit_title_edit_note")
                : itemType() === VaultItemType.Card
                ? t("edit_title_edit_card")
                : t("edit_title_edit_login"))
              : (itemType() === VaultItemType.SecureNote
                ? t("edit_title_add_note")
                : itemType() === VaultItemType.Card
                ? t("edit_title_add_card")
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
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder={itemType() === VaultItemType.SecureNote
                  ? t("edit_placeholder_name_note")
                  : itemType() === VaultItemType.Card
                  ? "e.g. Visa, Mastercard..."
                  : t("edit_placeholder_name_login")}
              />
            </div>
          </div>

          <Show when={itemType() === VaultItemType.Login}>
            <LoginEditFields
              username={username()}
              setUsername={setUsername}
              password={password()}
              setPassword={setPassword}
              uri={uri()}
              setUri={setUri}
              totpSecret={totpSecret()}
              setTotpSecret={setTotpSecret}
              fidoCredentials={fidoCredentials()}
              onDeleteFido={handleDeleteFidoCredential}
              scanning={scanning()}
              onScanQr={handleScanQr}
            />
          </Show>

          <Show when={itemType() === VaultItemType.Card}>
            <CardEditFields
              cardholderName={cardholderName()}
              setCardholderName={setCardholderName}
              cardNumber={cardNumber()}
              setCardNumber={setCardNumber}
              cardBrand={cardBrand()}
              setCardBrand={setCardBrand}
              cardExpMonth={cardExpMonth()}
              setCardExpMonth={setCardExpMonth}
              cardExpYear={cardExpYear()}
              setCardExpYear={setCardExpYear}
              cardCode={cardCode()}
              setCardCode={setCardCode}
            />
          </Show>

          <Show when={itemType() === VaultItemType.SecureNote}>
            <NoteEditFields
              notes={notes()}
              setNotes={setNotes}
              reprompt={reprompt()}
              setReprompt={setReprompt}
            />
          </Show>

          {/* Custom Fields in Edit Mode */}
          <Show when={fields().length > 0}>
            <div class="detail-section-title">{t("edit_label_fields")}</div>
            <div class="card mb-12">
              <For each={fields()}>
                {(field, index) => (
                  <Show
                    when={field.type === CustomFieldType.Divider}
                    fallback={
                      <div
                        draggable="true"
                        onDragStart={(e) => handleDragStart(index(), e)}
                        onDragOver={(e) => handleDragOver(index(), e)}
                        onDragEnd={handleDragEnd}
                        class={`draggable-field-row ${
                          draggedIndex() === index() ? "dragging" : ""
                        }`}
                      >
                        <div class="d-flex justify-between align-center">
                          <div class="d-flex align-center gap-6">
                            <div class="cursor-grab d-flex align-center justify-center text-muted">
                              <DragIcon class="icon-inline" />
                            </div>
                            <span class="font-w-600 font-sz-13">
                              {field.name}
                            </span>
                            <span class="field-sub-value">
                              {field.type === CustomFieldType.Hidden
                                ? "••••••••"
                                : (field.value || t("detail_no_value"))}
                            </span>
                          </div>
                          <div class="d-flex gap-8">
                            <button
                              type="button"
                              class="action-btn edit-field-btn"
                              onClick={() => handleOpenEditField(index())}
                              title={t("btn_edit")}
                            >
                              <EditIcon class="icon-inline" />
                            </button>
                            <button
                              type="button"
                              class="action-btn delete-field-btn"
                              onClick={() => handleRemoveField(index())}
                              title={t("btn_delete")}
                            >
                              <TrashIcon class="icon-inline" />
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    {/* Divider Edit Row */}
                    <div
                      draggable="true"
                      onDragStart={(e) => handleDragStart(index(), e)}
                      onDragOver={(e) => handleDragOver(index(), e)}
                      onDragEnd={handleDragEnd}
                      class={`draggable-field-row ${
                        draggedIndex() === index() ? "dragging" : ""
                      }`}
                    >
                      <div class="d-flex justify-between align-center">
                        <div class="d-flex align-center gap-6 flex-1">
                          <div class="cursor-grab d-flex align-center justify-center text-muted">
                            <DragIcon class="icon-inline" />
                          </div>
                          <span class="divider-row-title">
                            {field.name}
                          </span>
                        </div>
                        <div class="d-flex gap-8">
                          <button
                            type="button"
                            class="action-btn edit-field-btn"
                            onClick={() => handleOpenEditField(index())}
                            title={t("btn_edit")}
                          >
                            <EditIcon class="icon-inline" />
                          </button>
                          <button
                            type="button"
                            class="action-btn delete-field-btn"
                            onClick={() => handleRemoveField(index())}
                            title={t("btn_delete")}
                          >
                            <TrashIcon class="icon-inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </Show>

          {/* Button to Open Add Custom Field Modal */}
          <div class="mb-16">
            <button
              type="button"
              class="btn btn-secondary w-full add-field-trigger-btn"
              onClick={handleOpenAddField}
            >
              {t("edit_btn_add_field")}
            </button>
          </div>

          {/* Notes Section (Common to Login and Card) */}
          <Show when={itemType() !== VaultItemType.SecureNote}>
            <div class="detail-section-title">
              {t("edit_section_additional_options")}
            </div>
            <div class="card mb-16">
              <div class="form-group">
                <label for="item-notes">{t("edit_label_notes")}</label>
                <textarea
                  id="item-notes"
                  class="input-control resize-none"
                  value={notes()}
                  onInput={(e) => setNotes(e.currentTarget.value)}
                  placeholder={t("edit_placeholder_notes")}
                  rows="5"
                />
              </div>
              <div class="form-group mt-12">
                <Checkbox
                  id="item-reprompt"
                  checked={reprompt() === 1}
                  onChange={(checked) => setReprompt(checked ? 1 : 0)}
                  label={t("edit_label_reprompt")}
                />
              </div>
            </div>
          </Show>
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

      <CustomFieldModal
        isOpen={showEditFieldModal()}
        isEdit={selectedFieldIndex() !== null}
        initialField={initialField()}
        onClose={handleCloseFieldModal}
        onSave={handleSaveFieldEdit}
      />
    </div>
  );
};
export default ItemEdit;
