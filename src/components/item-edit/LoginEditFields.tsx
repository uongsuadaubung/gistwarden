import { type Component, createSignal, For, Show } from "solid-js";
import { type Fido2Credential } from "@/shared/types.ts";
import { t } from "@/shared/i18n.ts";
import Input from "@/components/Input.tsx";
import { EyeIcon, EyeOffIcon, QrIcon, TrashIcon } from "@/icons/svg/index.ts";

interface LoginEditFieldsProps {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  uri: string;
  setUri: (v: string) => void;
  totpSecret: string;
  setTotpSecret: (v: string) => void;
  fidoCredentials: Fido2Credential[];
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
        <div class="form-group">
          <label for="item-username">{t("edit_label_username")}</label>
          <Input
            id="item-username"
            type="text"
            value={props.username}
            onInput={(e) => props.setUsername(e.currentTarget.value)}
            placeholder={t("edit_placeholder_username")}
          />
        </div>

        <div class="form-group">
          <label for="item-password">{t("edit_label_password")}</label>
          <div class="pos-relative">
            <Input
              id="item-password"
              type={showPassword() ? "text" : "password"}
              class="password-font pr-40"
              value={props.password}
              onInput={(e) => props.setPassword(e.currentTarget.value)}
              placeholder={t("edit_placeholder_password")}
            />
            <div class="input-right-actions">
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
            </div>
          </div>
        </div>
      </div>

      {/* FIDO2/Passkey credentials (Read-only display of existing credentials with delete option) */}
      <Show when={props.fidoCredentials.length > 0}>
        <div class="detail-section-title">
          {t("detail_passkey_webauthn")}
        </div>
        <div class="card mb-16 fido2-credentials-list">
          <For each={props.fidoCredentials}>
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
        <div class="form-group">
          <label for="item-totp">{t("edit_label_totp")}</label>
          <div class="pos-relative">
            <Input
              id="item-totp"
              type={showTotpSecret() ? "text" : "password"}
              class="password-font pr-68"
              value={props.totpSecret}
              onInput={(e) => props.setTotpSecret(e.currentTarget.value)}
              placeholder={t("edit_placeholder_totp")}
            />
            <div class="input-right-actions">
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
            </div>
          </div>
        </div>
      </div>

      {/* Website Section */}
      <div class="detail-section-title">
        {t("detail_section_autofill")}
      </div>
      <div class="card mb-16">
        <div class="form-group">
          <label for="item-uri">{t("edit_label_website")}</label>
          <Input
            id="item-uri"
            type="text"
            value={props.uri}
            onInput={(e) => props.setUri(e.currentTarget.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>
    </>
  );
};

export default LoginEditFields;
