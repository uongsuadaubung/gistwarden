import { type Component, createSignal, Match, Switch } from "solid-js";
import { store } from "@/core/store.ts";
import { acceptWelcome } from "@/features/auth/auth-service.ts";
import { updateLanguage } from "@/core/ui-service.ts";
import Button from "@/components/ui/Button.tsx";
import { AppIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import SecurityIllustration from "@/features/welcome/components/SecurityIllustration.tsx";
import PasskeyIllustration from "@/features/welcome/components/PasskeyIllustration.tsx";
import TotpIllustration from "@/features/welcome/components/TotpIllustration.tsx";
import WarningIllustration from "@/features/welcome/components/WarningIllustration.tsx";

// Custom inline Chevron components to avoid extra file dependencies
const ChevronLeftIcon: Component = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon: Component = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const Welcome: Component = () => {
  const [activeSlide, setActiveSlide] = createSignal(0);
  const [agree, setAgree] = createSignal(false);

  const handleAcceptWelcome = () => {
    if (activeSlide() === 3 && agree()) {
      acceptWelcome();
    }
  };

  const handleNext = () => {
    if (activeSlide() < 3) {
      setActiveSlide(activeSlide() + 1);
    }
  };

  const handlePrev = () => {
    if (activeSlide() > 0) {
      setActiveSlide(activeSlide() - 1);
    }
  };

  return (
    <div class="app-body h-full">
      <div class="tour-container">
        {/* Header Area */}
        <div class="tour-header">
          <div class="tour-logo">
            <AppIcon class="tour-header-logo-img" />
            <span>{APP_NAME}</span>
          </div>

          <div class="login-lang-selector">
            <button
              type="button"
              class={`lang-toggle-btn ${
                store.language === "en" ? "active" : ""
              }`}
              onClick={() => updateLanguage("en")}
            >
              EN
            </button>
            <span class="lang-divider">|</span>
            <button
              type="button"
              class={`lang-toggle-btn ${
                store.language === "vi" ? "active" : ""
              }`}
              onClick={() => updateLanguage("vi")}
            >
              VI
            </button>
          </div>
        </div>

        {/* Content Slides */}
        <div class="tour-content-wrapper">
          <Switch>
            <Match when={activeSlide() === 0}>
              <div class="tour-slide">
                <div class="tour-svg-container">
                  <SecurityIllustration />
                </div>
                <h3 class="tour-title">{t("welcome_feat_security_title")}</h3>
                <p class="tour-desc">{t("welcome_feat_security_desc")}</p>
              </div>
            </Match>
            <Match when={activeSlide() === 1}>
              <div class="tour-slide">
                <div class="tour-svg-container">
                  <PasskeyIllustration />
                </div>
                <h3 class="tour-title">{t("welcome_feat_passkeys_title")}</h3>
                <p class="tour-desc">{t("welcome_feat_passkeys_desc")}</p>
              </div>
            </Match>
            <Match when={activeSlide() === 2}>
              <div class="tour-slide">
                <div class="tour-svg-container">
                  <TotpIllustration />
                </div>
                <h3 class="tour-title">{t("welcome_feat_totp_title")}</h3>
                <p class="tour-desc">{t("welcome_feat_totp_desc")}</p>
              </div>
            </Match>
            <Match when={activeSlide() === 3}>
              <div class="tour-slide">
                <div class="tour-svg-container">
                  <WarningIllustration />
                </div>
                <h3 class="tour-title">{t("welcome_security_notice_title")}</h3>
                <div class="tour-warning-card">
                  <p class="warning-bold">{t("welcome_warning_bold")}</p>
                  <p class="warning-sub">{t("welcome_warning_sub")}</p>
                </div>
              </div>
            </Match>
          </Switch>
        </div>

        {/* Dot and Arrow Navigation */}
        <div class="tour-navigation">
          <button
            type="button"
            class="tour-nav-btn"
            disabled={activeSlide() === 0}
            onClick={handlePrev}
            aria-label={t("welcome_btn_prev")}
          >
            <ChevronLeftIcon />
          </button>

          <div class="tour-dots">
            <button
              type="button"
              class={`tour-dot ${activeSlide() === 0 ? "active" : ""}`}
              onClick={() => setActiveSlide(0)}
              aria-label="Go to slide 1"
            />
            <button
              type="button"
              class={`tour-dot ${activeSlide() === 1 ? "active" : ""}`}
              onClick={() => setActiveSlide(1)}
              aria-label="Go to slide 2"
            />
            <button
              type="button"
              class={`tour-dot ${activeSlide() === 2 ? "active" : ""}`}
              onClick={() => setActiveSlide(2)}
              aria-label="Go to slide 3"
            />
            <button
              type="button"
              class={`tour-dot ${activeSlide() === 3 ? "active" : ""}`}
              onClick={() => setActiveSlide(3)}
              aria-label="Go to slide 4"
            />
          </div>

          <button
            type="button"
            class="tour-nav-btn"
            disabled={activeSlide() === 3}
            onClick={handleNext}
            aria-label={t("welcome_btn_next")}
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Bottom Actions Area */}
        <div class="tour-action-area">
          <Switch>
            <Match when={activeSlide() < 3}>
              <Button variant="primary" block onClick={handleNext}>
                {t("welcome_btn_next")}
              </Button>
            </Match>
            <Match when={activeSlide() === 3}>
              <div class="tour-checkbox-container">
                <label class="tour-checkbox-row">
                  <input
                    type="checkbox"
                    checked={agree()}
                    onChange={(e) => setAgree(e.currentTarget.checked)}
                    class="tour-checkbox"
                  />
                  <span class="tour-checkbox-label">
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
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
