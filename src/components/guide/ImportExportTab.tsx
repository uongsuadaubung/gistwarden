import { type Component } from "solid-js";
import { t } from "@/shared/i18n.ts";

export const ImportExportTab: Component = () => {
  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>🔄 {t("guide_ie_title")}</h2>
        <p>{t("guide_ie_subtitle")}</p>
      </div>

      <div class="features-detailed-grid">
        {/* Import */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper sync-icon-bg">📥</div>
          <div class="feature-content">
            <h3>{t("guide_ie_import_title")}</h3>
            <ul class="feature-bullets">
              <li>
                <strong>{t("guide_ie_import_step1_title")}</strong>
                <br />
                {t("guide_ie_import_step1_desc")}
              </li>
              <li>
                <strong>{t("guide_ie_import_step2_title")}</strong>
                <br />
                {t("guide_ie_import_step2_desc")}
              </li>
              <li>
                <strong>{t("guide_ie_import_step3_title")}</strong>
                <br />
                {t("guide_ie_import_step3_desc")}
              </li>
            </ul>
          </div>
        </div>

        {/* Export */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper offline-icon-bg">📤</div>
          <div class="feature-content">
            <h3>{t("guide_ie_export_title")}</h3>
            <p>{t("guide_ie_export_desc")}</p>
            <ul class="feature-bullets">
              <li>{t("guide_ie_export_step1")}</li>
              <li>{t("guide_ie_export_step2")}</li>
              <li>{t("guide_ie_export_step3")}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImportExportTab;
