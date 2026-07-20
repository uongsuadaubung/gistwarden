import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { getAssetUrl } from "@/core/runtime.ts";

export const GeneralTab: Component = () => {
  const heroImage = getAssetUrl("images/guide_hero.png");

  return (
    <section class="tab-panel fade-in">
      <div class="hero-section">
        <img src={heroImage} alt={`${APP_NAME} Guide Hero`} class="hero-img" />
        <div class="hero-overlay">
          <h2>{t("guide_welcome")}</h2>
          <p>{t("guide_subtitle")}</p>
        </div>
      </div>

      <div class="section-title">
        <h2>{t("guide_gen_title")}</h2>
        <div class="divider"></div>
      </div>

      <div class="steps-grid">
        <section class="guide-step">
          <div class="step-badge">
            <span class="step-num">01</span>
          </div>
          <div class="step-text">
            <h3>{t("guide_gen_step1_title")}</h3>
            <p>{t("guide_gen_step1_desc")}</p>
          </div>
        </section>

        <section class="guide-step">
          <div class="step-badge">
            <span class="step-num">02</span>
          </div>
          <div class="step-text">
            <h3>{t("guide_gen_step2_title")}</h3>
            <p>{t("guide_gen_step2_desc")}</p>
          </div>
        </section>

        <section class="guide-step">
          <div class="step-badge">
            <span class="step-num">03</span>
          </div>
          <div class="step-text">
            <h3>{t("guide_gen_step3_title")}</h3>
            <p>{t("guide_gen_step3_desc")}</p>
          </div>
        </section>
      </div>
    </section>
  );
};

export default GeneralTab;
