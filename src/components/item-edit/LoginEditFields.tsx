import { type Component, createSignal, For, Show } from "solid-js";
import { t } from "@/shared/i18n.ts";
import Input from "@/components/Input.tsx";
import { EyeIcon, EyeOffIcon, QrIcon, TrashIcon } from "@/icons/svg/index.ts";
import FormField from "@/components/FormField.tsx";
import type { ItemEditFormState } from "./vault-edit-helper.ts";

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
  const [showPassword, setShowPassword] = createSignal(false);
  const [showTotpSecret, setShowTotpSecret] = createSignal(false);

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
              type={showPassword() ? "text" : "password"}
              class="password-font"
              value={props.formState.password}
              onInput={(e) =>
                props.updateForm("password", e.currentTarget.value)}
              placeholder={t("edit_placeholder_password")}
              rightActions={
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  onClick={() => setShowPassword(!showPassword())}
                  title={t("edit_label_password")}
                >
                  <Show
                    when={showPassword()}
                    fallback={<EyeIcon class="icon-inline" />}
                  >
                    <EyeOffIcon class="icon-inline" />
                  </Show>
                </button>
              }
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
                  <span class="card-sub-text">RP: {cred.rpId}</span>
                </div>
                <button
                  type="button"
                  class="action-btn fido2-delete-btn"
                  onClick={() => props.onDeleteFido(cred.credentialId)}
                  title={t("edit_confirm_delete_passkey_title")}
                >
                  <TrashIcon class="icon-inline" />
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
              type={showTotpSecret() ? "text" : "password"}
              class="password-font"
              value={props.formState.totpSecret}
              onInput={(e) =>
                props.updateForm("totpSecret", e.currentTarget.value)}
              placeholder={t("edit_placeholder_totp")}
              rightActions={
                <>
                  <button
                    type="button"
                    class="action-btn input-action-btn"
                    onClick={() => setShowTotpSecret(!showTotpSecret())}
                    title={t("edit_placeholder_totp")}
                  >
                    <Show
                      when={showTotpSecret()}
                      fallback={<EyeIcon class="icon-inline" />}
                    >
                      <EyeOffIcon class="icon-inline" />
                    </Show>
                  </button>
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
                </>
              }
            />
          </div>
        </FormField>
      </div>

      {/* Website Section */}
      <div class="detail-section-title">
        {t("detail_section_autofill")}
      </div>
      <div class="card mb-16">
        <FormField id="item-uri" label={t("edit_label_website")}>
          <Input
            id="item-uri"
            type="text"
            value={props.formState.uri}
            onInput={(e) => props.updateForm("uri", e.currentTarget.value)}
            placeholder="https://example.com"
          />
        </FormField>
      </div>
    </>
  );
};

export default LoginEditFields;
