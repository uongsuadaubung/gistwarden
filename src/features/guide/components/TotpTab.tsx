import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";

export const TotpTab: Component = () => {
  const heroImage = chrome.runtime.getURL("images/guide_hero.png");
  const imgTotpStep1 = chrome.runtime.getURL(
    "images/totp/1. click icon scan if page show qr.jpg",
  );
  const imgTotpStep2 = chrome.runtime.getURL(
    "images/totp/2 save and copy otp.jpg",
  );

  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>🔑 {t("guide_totp_header_title")}</h2>
        <p>{t("guide_totp_header_desc")}</p>
      </div>

      <div class="steps-vertical">
        {/* STEP 1 */}
        <div class="vertical-step-card">
          <div class="step-index">1</div>
          <div class="step-content">
            <h3>{t("guide_totp_step1_title")}</h3>
            <p>{t("guide_totp_step1_desc")}</p>

            <div class="tutorial-image-container">
              <div class="image-wrapper">
                <img
                  src={imgTotpStep1}
                  alt="Scan QR"
                  class="tutorial-img"
                  onerror={(e) => {
                    const img = e.currentTarget;
                    if (img instanceof HTMLImageElement) {
                      img.src = heroImage;
                      img.style.opacity = "0.3";
                    }
                  }}
                />
                <div class="image-placeholder-info">
                  <span>💡 {t("guide_totp_step1_img_info")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div class="vertical-step-card">
          <div class="step-index">2</div>
          <div class="step-content">
            <h3>{t("guide_totp_step2_title")}</h3>
            <p>{t("guide_totp_step2_desc")}</p>

            <div class="tutorial-image-container">
              <div class="image-wrapper">
                <img
                  src={imgTotpStep2}
                  alt="Save and Copy"
                  class="tutorial-img"
                  onerror={(e) => {
                    const img = e.currentTarget;
                    if (img instanceof HTMLImageElement) {
                      img.src = heroImage;
                      img.style.opacity = "0.3";
                    }
                  }}
                />
                <div class="image-placeholder-info">
                  <span>💡 {t("guide_totp_step2_img_info")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div class="vertical-step-card">
          <div class="step-index">3</div>
          <div class="step-content">
            <h3>{t("guide_totp_step3_title")}</h3>
            <p>{t("guide_totp_step3_desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TotpTab;
