import { type Component, createSignal } from "solid-js";
import { store } from "@/shared/store.ts";
import { acceptWelcome } from "@/shared/auth-service.ts";
import { updateLanguage } from "@/shared/ui-service.ts";
import Button from "@/components/Button.tsx";
import { AppIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import { APP_NAME } from "@/shared/constants.ts";

export const Welcome: Component = () => {
  const [agree, setAgree] = createSignal(false);

  const handleAcceptWelcome = () => {
    acceptWelcome();
  };

  return (
    <div class="app-body justify-center h-full relative">
      {/* Floating Language Switcher */}
      <div class="login-lang-selector">
        <button
          type="button"
          class={`lang-toggle-btn ${store.language === "en" ? "active" : ""}`}
          onClick={() => updateLanguage("en")}
        >
          EN
        </button>
        <span class="lang-divider">|</span>
        <button
          type="button"
          class={`lang-toggle-btn ${store.language === "vi" ? "active" : ""}`}
          onClick={() => updateLanguage("vi")}
        >
          VI
        </button>
      </div>

      <div class="text-center mb-16">
        <AppIcon class="login-header-logo" />
        <h2 class="login-brand-title">{APP_NAME}</h2>
        <p class="login-subtitle">{t("welcome_desc")}</p>
      </div>

      <div class="card mb-16 p-16 welcome-card scrollable">
        <p class="welcome-section-title">{t("welcome_subtitle_intro")}</p>
        <div class="welcome-features-list">
          <div class="feature-item">
            <span class="feature-icon">🔑</span>
            <div class="feature-text">
              <strong class="feature-title">
                {t("welcome_feat_security_title")}
              </strong>
              <p class="feature-desc">{t("welcome_feat_security_desc")}</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <div class="feature-text">
              <strong class="feature-title">
                {t("welcome_feat_passkeys_title")}
              </strong>
              <p class="feature-desc">{t("welcome_feat_passkeys_desc")}</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⏱️</span>
            <div class="feature-text">
              <strong class="feature-title">
                {t("welcome_feat_totp_title")}
              </strong>
              <p class="feature-desc">{t("welcome_feat_totp_desc")}</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔄</span>
            <div class="feature-text">
              <strong class="feature-title">
                {t("welcome_feat_backup_title")}
              </strong>
              <p class="feature-desc">{t("welcome_feat_backup_desc")}</p>
            </div>
          </div>
        </div>

        <div class="welcome-notice-box mt-16">
          <div class="notice-header">
            {t("welcome_security_notice_title")}
          </div>
          <p class="notice-desc">
            {t("welcome_security_notice_desc")}
          </p>
          <p class="notice-danger-text">
            <strong>{t("welcome_warning_bold")}</strong>
          </p>
          <p class="notice-sub">
            {t("welcome_warning_sub")}
          </p>
        </div>
      </div>

      <label class="welcome-agree-row mb-16">
        <input
          type="checkbox"
          checked={agree()}
          onChange={(e) => {
            setAgree(e.currentTarget.checked);
          }}
          class="welcome-checkbox"
        />
        <span class="welcome-checkbox-label">
          {t("welcome_checkbox_label")}
        </span>
      </label>

      <Button
        variant="primary"
        block
        disabled={!agree()}
        onClick={handleAcceptWelcome}
      >
        {t("welcome_btn_continue")}
      </Button>
    </div>
  );
};

export default Welcome;
