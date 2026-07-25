import { type Component, createSignal, For, Index, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import Select from "@/components/ui/Select.tsx";
import {
  DragIcon,
  MinusCircleIcon,
  PlusIcon,
  QrIcon,
  SettingsIcon,
} from "@/icons/svg/index.ts";
import FormField from "@/components/ui/FormField.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";
import { UriMatchMode } from "@/features/vault/vault-schemas.ts";
import { confirm } from "@/core/ui-service.ts";

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
  const [openGears, setOpenGears] = createSignal<Record<number, boolean>>({});

  const toggleGear = (index: number) => {
    setOpenGears((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isGearOpen = (index: number) => Boolean(openGears()[index]);

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

  const handleMatchModeChange = async (index: number, valStr: string) => {
    let newMode: UriMatchMode | null = null;
    if (valStr !== "") {
      const num = Number(valStr);
      if (num === UriMatchMode.Domain) newMode = UriMatchMode.Domain;
      else if (num === UriMatchMode.Host) newMode = UriMatchMode.Host;
      else if (num === UriMatchMode.StartsWith) {
        newMode = UriMatchMode.StartsWith;
      } else if (num === UriMatchMode.Exact) newMode = UriMatchMode.Exact;
      else if (num === UriMatchMode.Regex) newMode = UriMatchMode.Regex;
      else if (num === UriMatchMode.Never) newMode = UriMatchMode.Never;
    }

    if (
      newMode === UriMatchMode.StartsWith ||
      newMode === UriMatchMode.Regex
    ) {
      const modeName = newMode === UriMatchMode.StartsWith
        ? t("match_mode_starts_with")
        : t("match_mode_regex");
      const title = t("match_warning_modal_title");
      const linkHtml =
        `<a href="https://bitwarden.com/help/uri-match-detection/" target="_blank" rel="noopener noreferrer">${
          t("match_warning_learn_more")
        }</a>`;
      const msg = `${
        t("match_warning_modal_msg").replace("{mode}", modeName)
      }<br/><br/>${linkHtml}`;

      const approved = await confirm(title, msg, "warning");
      if (!approved) {
        return;
      }
    }

    const currentUris = props.formState.uris || [];
    const newUris = currentUris.map((u, i) =>
      i === index ? { ...u, match: newMode } : u
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

  const getDefaultMatchLabel = () => {
    return t("match_mode_default").replace("{mode}", t("match_mode_domain"));
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
      <div class="card mb-16 autofill-card overflow-visible">
        <Index each={props.formState.uris || []}>
          {(u, idx) => (
            <FormField
              id={`item-uri-${idx}`}
              label={idx === 0
                ? t("edit_label_website")
                : `${t("edit_label_website")} ${idx + 1}`}
            >
              <div
                class="website-input-row mb-8"
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
                      <div class="d-flex align-items-center gap-4">
                        <button
                          type="button"
                          class={`action-btn input-action-btn ${
                            isGearOpen(idx) || u().match != null
                              ? "text-primary font-bold"
                              : ""
                          }`}
                          onClick={() => toggleGear(idx)}
                          title={t("match_detection_label")}
                        >
                          <SettingsIcon class="icon-inline" />
                        </button>
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
                      </div>
                    }
                  />
                </div>
                <Show when={props.formState.uris.length > 1}>
                  <div class="website-drag-handle" title="Drag to reorder">
                    <DragIcon class="icon-inline" />
                  </div>
                </Show>
              </div>

              <Show when={isGearOpen(idx) || u().match != null}>
                <div class="match-detection-container">
                  <div class="match-detection-label">
                    {t("match_detection_label")}
                  </div>
                  <Select
                    id={`item-uri-match-${idx}`}
                    value={u().match ?? ""}
                    onChange={(e) =>
                      handleMatchModeChange(idx, e.currentTarget.value)}
                    options={[
                      { value: "", label: getDefaultMatchLabel() },
                      {
                        value: UriMatchMode.Domain,
                        label: t("match_mode_domain"),
                      },
                      { value: UriMatchMode.Host, label: t("match_mode_host") },
                      {
                        value: UriMatchMode.Exact,
                        label: t("match_mode_exact"),
                      },
                      {
                        value: UriMatchMode.Never,
                        label: t("match_mode_never"),
                      },
                      {
                        value: "header-advanced",
                        label: t("match_mode_header_advanced"),
                        isHeader: true,
                      },
                      {
                        value: UriMatchMode.StartsWith,
                        label: t("match_mode_starts_with"),
                      },
                      {
                        value: UriMatchMode.Regex,
                        label: t("match_mode_regex"),
                      },
                    ]}
                  />
                  <div class="match-detection-desc">
                    {t("match_detection_desc")}
                    <Show
                      when={u().match === UriMatchMode.StartsWith ||
                        u().match === UriMatchMode.Regex}
                    >
                      <span class="text-warning-bold">
                        {t("match_warning_inline").replace(
                          "{mode}",
                          u().match === UriMatchMode.StartsWith
                            ? t("match_mode_starts_with")
                            : t("match_mode_regex"),
                        )}
                      </span>
                      <a
                        href="https://bitwarden.com/help/uri-match-detection/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="match-warning-link"
                      >
                        {t("match_warning_learn_more")}
                      </a>
                    </Show>
                  </div>
                </div>
              </Show>
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
