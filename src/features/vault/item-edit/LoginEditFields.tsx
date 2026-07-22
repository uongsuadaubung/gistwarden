import { type Component, createSignal, For, Index, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import {
  DragIcon,
  MinusCircleIcon,
  PlusIcon,
  QrIcon,
} from "@/icons/svg/index.ts";
import FormField from "@/components/ui/FormField.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";

interface LoginEditFieldsProps {
  formState: ItemEditFormState;
  updateForm: <K extends keyof ItemEditFormState>(
    key: K,
    val: ItemEditFormState[K],
  ) => void;
  onDeleteFido: (id: string) => void;
  scanning: boolean;
  onScanQr: () => void;
}

export const LoginEditFields: Component<LoginEditFieldsProps> = (props) => {
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);

  const handleAddWebsite = () => {
    const currentUris = props.formState.uris || [];
    const newUris = [...currentUris, { uri: "", match: null }];
    props.updateForm("uris", newUris);
  };

  const handleUpdateWebsiteUri = (index: number, value: string) => {
    const currentUris = props.formState.uris || [];
    const newUris = currentUris.map((u, i) =>
      i === index ? { ...u, uri: value } : u
    );
    props.updateForm("uris", newUris);
  };

  const handleDeleteWebsite = (index: number) => {
    const currentUris = props.formState.uris || [];
    const newUris = currentUris.filter((_, i) => i !== index);
    props.updateForm("uris", newUris);
  };

  const handleDragStart = (index: number, e: DragEvent) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    }
  };

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault();
    const dragged = draggedIndex();
    if (dragged === null || dragged === index) return;

    const currentUris = [...(props.formState.uris || [])];
    const item = currentUris.splice(dragged, 1)[0];
    currentUris.splice(index, 0, item);
    props.updateForm("uris", currentUris);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <>
      <div class="detail-section-title">{t("detail_section_login")}</div>
      <div class="card mb-16">
        <FormField id="item-username" label={t("edit_label_username")}>
          <Input
            id="item-username"
            type="text"
            value={props.formState.username}
            onInput={(e) => props.updateForm("username", e.currentTarget.value)}
            placeholder={t("edit_placeholder_username")}
          />
        </FormField>

        <FormField id="item-password" label={t("edit_label_password")}>
          <div class="pos-relative">
            <Input
              id="item-password"
              type="password"
              class="password-font"
              value={props.formState.password}
              onInput={(e) =>
                props.updateForm("password", e.currentTarget.value)}
              placeholder={t("edit_placeholder_password")}
            />
          </div>
        </FormField>
      </div>

      {/* FIDO2/Passkey credentials (Read-only display of existing credentials with delete option) */}
      <Show when={(props.formState.fidoCredentials || []).length > 0}>
        <div class="detail-section-title">
          {t("detail_passkey_webauthn")}
        </div>
        <div class="card mb-16 fido2-credentials-list">
          <For each={props.formState.fidoCredentials || []}>
            {(cred) => (
              <div class="fido2-cred-row">
                <div>
                  <strong>{cred.userName || t("detail_no_value")}</strong>
                </div>
                <button
                  type="button"
                  class="action-btn fido2-delete-btn"
                  onClick={() => props.onDeleteFido(cred.credentialId)}
                  title={t("edit_confirm_delete_passkey_title")}
                >
                  <MinusCircleIcon class="icon-inline text-error" />
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* TOTP Section */}
      <div class="detail-section-title">
        {t("detail_section_security")}
      </div>
      <div class="card mb-16">
        <FormField id="item-totp" label={t("edit_label_totp")}>
          <div class="pos-relative">
            <Input
              id="item-totp"
              type="password"
              class="password-font"
              value={props.formState.totpSecret}
              onInput={(e) =>
                props.updateForm("totpSecret", e.currentTarget.value)}
              placeholder={t("edit_placeholder_totp")}
              rightActions={
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  title={t("edit_placeholder_totp")}
                  onClick={props.onScanQr}
                  disabled={props.scanning}
                >
                  <QrIcon
                    class={props.scanning
                      ? "spinning icon-inline"
                      : "icon-inline"}
                  />
                </button>
              }
            />
          </div>
        </FormField>
      </div>

      {/* Website Section */}
      <div class="detail-section-title">
        {t("detail_section_autofill")}
      </div>
      <div class="card mb-16 autofill-card">
        <Index each={props.formState.uris || []}>
          {(u, idx) => (
            <FormField
              id={`item-uri-${idx}`}
              label={idx === 0
                ? t("edit_label_website")
                : `${t("edit_label_website")} ${idx + 1}`}
            >
              <div
                class="website-input-row"
                draggable={props.formState.uris.length > 1}
                onDragStart={(e) => handleDragStart(idx, e)}
                onDragOver={(e) => handleDragOver(idx, e)}
                onDragEnd={handleDragEnd}
              >
                <div class="flex-grow">
                  <Input
                    id={`item-uri-${idx}`}
                    type="text"
                    value={u().uri}
                    onInput={(e) =>
                      handleUpdateWebsiteUri(idx, e.currentTarget.value)}
                    placeholder="https://example.com"
                    rightActions={
                      <Show when={props.formState.uris.length > 1}>
                        <button
                          type="button"
                          class="action-btn input-action-btn"
                          onClick={() => handleDeleteWebsite(idx)}
                          title={t("edit_btn_delete_website")}
                        >
                          <MinusCircleIcon class="icon-inline text-error" />
                        </button>
                      </Show>
                    }
                  />
                </div>
                <Show when={props.formState.uris.length > 1}>
                  <div class="website-drag-handle" title="Drag to reorder">
                    <DragIcon class="icon-inline" />
                  </div>
                </Show>
              </div>
            </FormField>
          )}
        </Index>
        <button
          type="button"
          class="add-website-btn"
          onClick={handleAddWebsite}
        >
          <PlusIcon class="icon-inline mr-4" />
          {t("edit_btn_add_website")}
        </button>
      </div>
    </>
  );
};

export default LoginEditFields;
