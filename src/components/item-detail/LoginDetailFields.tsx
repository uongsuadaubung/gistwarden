import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { type LoginVaultItem } from "@/shared/types.ts";
import { t } from "@/shared/i18n.ts";
import { APP_NAME } from "@/shared/constants.ts";
import * as OTPAuth from "otpauth";
import { parseTotpSecret } from "@/shared/totp-utils.ts";
import { store } from "@/shared/store.ts";
import {
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/icons/svg/index.ts";

interface LoginDetailFieldsProps {
  item: LoginVaultItem;
  onCopy: (text: string, label: string) => void;
}

export const LoginDetailFields: Component<LoginDetailFieldsProps> = (props) => {
  const [showPassword, setShowPassword] = createSignal(false);
  const [totpCode, setTotpCode] = createSignal("");
  const [totpRemaining, setTotpRemaining] = createSignal(30);

  let timerId: ReturnType<typeof setInterval> | undefined;

  // Circle dimensions for countdown
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = () => {
    return circumference - (totpRemaining() / 30) * circumference;
  };

  const updateTotp = () => {
    const rawSecret = props.item.login.totp || "";
    const epoch = Math.floor((Date.now() + store.timeOffset) / 1000);
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
      const rawCode = totp.generate({ timestamp: Date.now() + store.timeOffset });
      const formatted = rawCode.slice(0, 3) + " " + rawCode.slice(3);
      setTotpCode(formatted);
    } catch (err) {
      console.error(`[${APP_NAME}] TOTP Generation error:`, err);
      setTotpCode(t("detail_totp_error"));
    }
  };

  onMount(() => {
    updateTotp();
    timerId = setInterval(updateTotp, 1000);
  });

  onCleanup(() => {
    if (timerId) clearInterval(timerId);
  });

  const getUri = (): string => {
    return props.item.login.uris?.[0]?.uri || "";
  };

  const getFidoCredentials = () => {
    return props.item.login.fido2Credentials || [];
  };

  return (
    <>
      {/* Card 1: Login Credentials */}
      <div class="detail-section-title mt-0">
        {t("detail_section_login")}
      </div>
      <div class="card mb-16">
        {/* Username Field */}
        <div class="detail-row">
          <div class="field-content">
            <div class="field-label">{t("edit_label_username")}</div>
            <div class="field-value text-break">
              {props.item.login.username || t("detail_no_value")}
            </div>
          </div>
          <Show when={props.item.login.username}>
            <button
              type="button"
              class="action-btn"
              onClick={() =>
                props.onCopy(
                  props.item.login.username || "",
                  t("edit_label_username"),
                )}
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
            <div class="field-value password-font text-break">
              {showPassword()
                ? (props.item.login.password || "")
                : "••••••••••••"}
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
            <Show when={props.item.login.password}>
              <button
                type="button"
                class="action-btn"
                onClick={() =>
                  props.onCopy(
                    props.item.login.password || "",
                    t("edit_label_password"),
                  )}
                title={t("detail_copy_password")}
              >
                <CopyIcon />
              </button>
            </Show>
          </div>
        </div>
      </div>

      {/* Card 2: Security & OTP */}
      <Show when={totpCode() || getFidoCredentials().length > 0}>
        <div class="detail-section-title">
          {t("detail_section_security")}
        </div>
        <div class="card mb-16">
          {/* Rolling TOTP Display */}
          <Show when={totpCode()}>
            <div
              class="totp-row"
              onClick={() =>
                props.onCopy(
                  totpCode().replace(/\s/g, ""),
                  t("detail_totp_label"),
                )}
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
          <Show when={getFidoCredentials().length > 0}>
            <For each={getFidoCredentials()}>
              {(cred) => (
                <div class="detail-row">
                  <div class="field-content">
                    <div class="field-label">
                      {t("detail_passkey_webauthn")}
                    </div>
                    <div class="field-value text-break">
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
            <div class="field-value text-break">
              {getUri() || t("detail_no_value")}
            </div>
          </div>
          <Show when={getUri()}>
            <div class="field-actions">
              <button
                type="button"
                class="action-btn"
                onClick={() => {
                  let target = getUri();
                  if (!/^https?:\/\//i.test(target)) {
                    target = "https://" + target;
                  }
                  window.open(target, "_blank");
                }}
                title={t("detail_visit_website")}
              >
                <ExternalLinkIcon class="icon-inline" />
              </button>
              <button
                type="button"
                class="action-btn"
                onClick={() => props.onCopy(getUri(), t("edit_label_website"))}
                title={t("edit_label_website")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>
        </div>
      </div>
    </>
  );
};

export default LoginDetailFields;
