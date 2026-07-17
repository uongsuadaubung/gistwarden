import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import {
  type Fido2Credential,
  type VaultField,
  VaultItemType,
} from "@/shared/types.ts";
import Button from "@/components/Button.tsx";
import { APP_NAME } from "@/shared/constants.ts";
import * as OTPAuth from "otpauth";
import { parseTotpSecret } from "@/shared/totp-utils.ts";
import {
  ArrowLeftIcon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
} from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import { handlePopout, isPopout } from "@/shared/popout-utils.ts";

export const ItemDetail: Component = () => {
  // Local view states
  const [name, setName] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [uri, setUri] = createSignal("");
  const [totpSecret, setTotpSecret] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [fidoCredentials, setFidoCredentials] = createSignal<Fido2Credential[]>(
    [],
  );
  const [fields, setFields] = createSignal<VaultField[]>([]);
  const [visibleFields, setVisibleFields] = createSignal<
    Record<number, boolean>
  >({});

  // UI state
  const [showPassword, setShowPassword] = createSignal(false);
  const [totpCode, setTotpCode] = createSignal("");
  const [totpRemaining, setTotpRemaining] = createSignal(30);
  const [error, setError] = createSignal("");

  let timerId: ReturnType<typeof setInterval> | undefined;

  // Circle dimensions for countdown
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = () => {
    return circumference - (totpRemaining() / 30) * circumference;
  };

  // Populate form states on mount
  onMount(() => {
    const item = store.selectedItem;
    if (item) {
      setName(item.name || "");
      if (item.type === VaultItemType.Login) {
        setUsername(item.login.username || "");
        setPassword(item.login.password || "");
        setUri(item.login.uris?.[0]?.uri || "");
        setTotpSecret(item.login.totp || "");
        setFidoCredentials(item.login.fido2Credentials || []);
      } else {
        setUsername("");
        setPassword("");
        setUri("");
        setTotpSecret("");
        setFidoCredentials([]);
      }
      setNotes(item.notes || "");
      setFields(item.fields || []);
    }

    updateTotp();
    timerId = setInterval(updateTotp, 1000);
  });

  onCleanup(() => {
    if (timerId) clearInterval(timerId);
  });

  const updateTotp = () => {
    const rawSecret = totpSecret();
    const epoch = Math.floor(Date.now() / 1000);
    const remaining = 30 - (epoch % 30);
    setTotpRemaining(remaining);

    if (!rawSecret.trim()) {
      setTotpCode("");
      return;
    }

    const secret = parseTotpSecret(rawSecret);

    try {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
      });
      const rawCode = totp.generate();
      // Format code as "123 456"
      const formatted = rawCode.slice(0, 3) + " " + rawCode.slice(3);
      setTotpCode(formatted);
    } catch (err) {
      console.error(`[${APP_NAME}] TOTP Generation error:`, err);
      setTotpCode(t("detail_totp_error"));
    }
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
      {/* Header */}
      <div class="detail-item-header justify-between">
        <div class="d-flex align-center gap-12">
          <div class="back-btn detail-back-btn" onClick={handleBackToVault}>
            <ArrowLeftIcon class="icon-inline-large" />
          </div>
          <div class="detail-title detail-header-title">
            {store.selectedItem?.type === VaultItemType.SecureNote
              ? t("detail_title_note")
              : t("detail_title_login")}
          </div>
        </div>
        <div class="d-flex align-center gap-8">
          <Show when={!isPopout()}>
            <button
              type="button"
              class="action-btn"
              onClick={handlePopout}
              title={t("vault_popout_title")}
            >
              <ExternalLinkIcon />
            </button>
          </Show>
        </div>
      </div>

      <div class="detail-form">
        {/* Scrollable Body */}
        <div class="app-body pb-24">
          <Show when={error()}>
            <div class="alert alert-danger">{error()}</div>
          </Show>

          <div class="detail-view-header">
            <div class="detail-view-name">{name() || t("detail_no_value")}</div>
          </div>

          {/* Card 1, 2, 3: Login Credentials */}
          <Show when={store.selectedItem?.type !== VaultItemType.SecureNote}>
            {/* Card 1: Login Credentials */}
            <div class="detail-section-title mt-0">
              {t("detail_section_login")}
            </div>
            <div class="card mb-16">
              {/* Username Field */}
              <div class="detail-row">
                <div class="field-content">
                  <div class="field-label">{t("edit_label_username")}</div>
                  <div class="field-value">
                    {username() || t("detail_no_value")}
                  </div>
                </div>
                <Show when={username()}>
                  <button
                    type="button"
                    class="action-btn"
                    onClick={() => handleCopy(username(), "username")}
                    title={t("detail_copy_username")}
                  >
                    <CopyIcon />
                  </button>
                </Show>
              </div>

              {/* Password Field */}
              <div class="detail-row">
                <div class="field-content">
                  <div class="field-label">{t("edit_label_password")}</div>
                  <div class="field-value password-font">
                    {showPassword() ? password() : "••••••••••••"}
                  </div>
                </div>
                <div class="field-actions">
                  <button
                    type="button"
                    class="action-btn"
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
                  <Show when={password()}>
                    <button
                      type="button"
                      class="action-btn"
                      onClick={() => handleCopy(password(), "password")}
                      title={t("detail_copy_password")}
                    >
                      <CopyIcon />
                    </button>
                  </Show>
                </div>
              </div>
            </div>

            {/* Card 2: Security & OTP */}
            <Show when={totpCode() || fidoCredentials().length > 0}>
              <div class="detail-section-title">
                {t("detail_section_security")}
              </div>
              <div class="card mb-16">
                {/* Rolling TOTP Display */}
                <Show when={totpCode()}>
                  <div
                    class="totp-row"
                    onClick={() =>
                      handleCopy(totpCode().replace(/\s/g, ""), "totp")}
                    title={t("detail_copy_totp")}
                  >
                    <div class="totp-content">
                      <div class="totp-label">{t("detail_totp_label")}</div>
                      <div class="totp-code">{totpCode()}</div>
                    </div>
                    {/* Countdown ring */}
                    <div class="totp-timer">
                      <svg class="timer-ring">
                        <circle cx="12" cy="12" r={radius} />
                        <circle
                          class="progress"
                          cx="12"
                          cy="12"
                          r={radius}
                          stroke-dasharray={String(circumference)}
                          stroke-dashoffset={String(strokeDashoffset())}
                        />
                      </svg>
                      <span class="timer-text">{totpRemaining()}</span>
                    </div>
                  </div>
                </Show>
                {/* Passkeys list */}
                <Show when={fidoCredentials().length > 0}>
                  <For each={fidoCredentials()}>
                    {(cred) => (
                      <div class="detail-row">
                        <div class="field-content">
                          <div class="field-label">
                            {t("detail_passkey_webauthn")}
                          </div>
                          <div class="field-value">
                            <strong>
                              {cred.userName || t("detail_no_value")}
                            </strong>{" "}
                            (RP: {cred.rpId})
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </Show>

            {/* Card 3: Auto-fill Options */}
            <div class="detail-section-title">
              {t("detail_section_autofill")}
            </div>
            <div class="card mb-16">
              {/* URI Field */}
              <div class="detail-row">
                <div class="field-content">
                  <div class="field-label">{t("edit_label_website")}</div>
                  <div class="field-value">{uri() || t("detail_no_value")}</div>
                </div>
                <Show when={uri()}>
                  <div class="field-actions">
                    <button
                      type="button"
                      class="action-btn"
                      onClick={() => window.open(uri(), "_blank")}
                      title={t("detail_visit_website")}
                    >
                      <ExternalLinkIcon class="icon-inline" />
                    </button>
                    <button
                      type="button"
                      class="action-btn"
                      onClick={() => handleCopy(uri(), "website")}
                      title={t("edit_label_website")}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Card 4: Custom Fields */}
          <Show when={fields().length > 0}>
            <div
              class="detail-section-title"
              style={{
                "margin-top":
                  store.selectedItem?.type === VaultItemType.SecureNote
                    ? "0"
                    : "16px",
              }}
            >
              {t("edit_label_fields")}
            </div>
            <div class="card mb-16">
              <For each={fields()}>
                {(field, index) => (
                  <Show
                    when={field.type === 2}
                    fallback={
                      <div class="detail-row">
                        <div class="field-content">
                          <div class="field-label">
                            {field.name || t("edit_label_fields")}
                          </div>
                          <div class="field-value">
                            {field.type === 1
                              ? (visibleFields()[index()]
                                ? field.value
                                : "••••••••••••")
                              : field.value || t("detail_no_value")}
                          </div>
                        </div>
                        <div class="field-actions">
                          <Show when={field.type === 1}>
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

          {/* Card 5: Notes display */}
          <Show when={notes()}>
            <div
              class="detail-section-title"
              style={{
                "margin-top":
                  (store.selectedItem?.type === VaultItemType.SecureNote &&
                      fields().length === 0)
                    ? "0"
                    : "16px",
              }}
            >
              {t("edit_label_notes")}
            </div>
            <div class="card mb-16">
              <div class="notes-display">{notes()}</div>
            </div>
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
