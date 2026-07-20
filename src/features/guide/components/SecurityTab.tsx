import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";

export const SecurityTab: Component = () => {
  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>🛡️ {t("guide_sec_title")}</h2>
        <p>{t("guide_sec_subtitle")}</p>
      </div>

      <div class="features-detailed-grid">
        {/* Zero Knowledge */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper sync-icon-bg">🔑</div>
          <div class="feature-content">
            <h3>{t("guide_sec_card1_title")}</h3>
            <p>{t("guide_sec_card1_desc")}</p>
          </div>
        </div>

        {/* Password Protection */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper collect-icon-bg">🧠</div>
          <div class="feature-content">
            <h3>{t("guide_sec_card2_title")}</h3>
            <p>{t("guide_sec_card2_desc")}</p>
          </div>
        </div>

        {/* Secure Cloud Sync */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper offline-icon-bg">🔒</div>
          <div class="feature-content">
            <h3>{t("guide_sec_card3_title")}</h3>
            <p>{t("guide_sec_card3_desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityTab;
