import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";

export const PrivacyTab: Component = () => {
  return (
    <div class="guide-content-tab fade-in">
      <div class="tab-header-box mb-24">
        <h2 class="tab-main-title">{t("guide_privacy_title")}</h2>
        <p class="tab-subtitle-text">{t("guide_privacy_subtitle")}</p>
      </div>

      <div class="info-card-group">
        {/* Section 1 */}
        <div class="info-card mb-20 p-20">
          <h3 class="card-section-title mb-8">
            {t("guide_privacy_sec1_title")}
          </h3>
          <p class="card-desc-text text-justify">
            {t("guide_privacy_sec1_desc")}
          </p>
        </div>

        {/* Section 2 */}
        <div class="info-card mb-20 p-20">
          <h3 class="card-section-title mb-8">
            {t("guide_privacy_sec2_title")}
          </h3>
          <p class="card-desc-text text-justify">
            {t("guide_privacy_sec2_desc")}
          </p>
        </div>

        {/* Section 3 */}
        <div class="info-card mb-20 p-20">
          <h3 class="card-section-title mb-8">
            {t("guide_privacy_sec3_title")}
          </h3>
          <p class="card-desc-text text-justify">
            {t("guide_privacy_sec3_desc")}
          </p>
        </div>

        {/* Section 4 */}
        <div class="info-card mb-20 p-20">
          <h3 class="card-section-title mb-8">
            {t("guide_privacy_sec4_title")}
          </h3>
          <p class="card-desc-text text-justify">
            {t("guide_privacy_sec4_desc")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTab;
