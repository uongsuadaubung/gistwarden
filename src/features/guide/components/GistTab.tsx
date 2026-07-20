import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { getAssetUrl } from "@/core/runtime.ts";

export const GistTab: Component = () => {
  const heroImage = getAssetUrl("images/guide_hero.png");
  const step1Image = getAssetUrl("images/1.select exprire time.png");
  const step2Image = getAssetUrl(
    "images/2.make sure selected gist.png",
  );
  const step3Image = getAssetUrl(
    "images/3.create generate button.png",
  );
  const step4Image = getAssetUrl("images/4.copy and save token.png");

  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>🔑 {t("guide_token_title")}</h2>
        <p>{t("guide_token_desc")}</p>
      </div>

      <div class="steps-vertical">
        {/* STEP 1 */}
        <div class="vertical-step-card">
          <div class="step-index">1</div>
          <div class="step-content">
            <h3>{t("guide_token_step1_title")}</h3>
            <p>{t("guide_token_step1_desc")}</p>
            <a
              href={`https://github.com/settings/tokens/new?description=${
                encodeURIComponent(APP_NAME)
              }&scopes=gist`}
              target="_blank"
              rel="noopener noreferrer"
              class="action-link-btn"
            >
              🚀 {t("guide_token_step1_btn")}
            </a>

            <div class="tutorial-image-container">
              <div class="image-wrapper">
                <img
                  src={step1Image}
                  alt="Select Expiration"
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
                  <span>💡 {t("guide_token_step1_img_info")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div class="vertical-step-card">
          <div class="step-index">2</div>
          <div class="step-content">
            <h3>{t("guide_token_step2_title")}</h3>
            <p>{t("guide_token_step2_desc")}</p>

            <div class="tutorial-image-container">
              <div class="image-wrapper">
                <img
                  src={step2Image}
                  alt="Select Gist Scope"
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
                  <span>💡 {t("guide_token_step2_img_info")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div class="vertical-step-card">
          <div class="step-index">3</div>
          <div class="step-content">
            <h3>{t("guide_token_step3_title")}</h3>
            <p>{t("guide_token_step3_desc")}</p>

            <div class="tutorial-image-container">
              <div class="image-wrapper">
                <img
                  src={step3Image}
                  alt="Generate Token Button"
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
                  <span>💡 {t("guide_token_step3_img_info")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4 */}
        <div class="vertical-step-card">
          <div class="step-index">4</div>
          <div class="step-content">
            <h3>{t("guide_token_step4_title")}</h3>
            <p>{t("guide_token_step4_desc")}</p>

            <div class="tutorial-image-container">
              <div class="image-wrapper">
                <img
                  src={step4Image}
                  alt="Copy and Paste Token"
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
                  <span>💡 {t("guide_token_step4_img_info")}</span>
                </div>
              </div>

              <div class="tip-banner">
                <span class="tip-icon">⚠️</span>
                <p>
                  <strong>{t("guide_token_important_note")}</strong>
                  {t("guide_token_note_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GistTab;
