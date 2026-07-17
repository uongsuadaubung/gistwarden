import { type Component } from "solid-js";
import { t } from "@/shared/i18n.ts";

export const FaqTab: Component = () => {
  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>💡 {t("guide_faq_title")}</h2>
        <p>{t("guide_faq_subtitle")}</p>
      </div>

      <div class="faq-grid">
        {/* Q1 */}
        <div class="faq-card text-highlight">
          <h4>{t("guide_faq_q1_title")}</h4>
          <p>{t("guide_faq_q1_desc")}</p>
        </div>

        {/* Q2 */}
        <div class="faq-card">
          <h4>{t("guide_faq_q2_title")}</h4>
          <p>{t("guide_faq_q2_desc")}</p>
        </div>

        {/* Q3 */}
        <div class="faq-card">
          <h4>{t("guide_faq_q3_title")}</h4>
          <p>{t("guide_faq_q3_desc")}</p>
        </div>

        {/* Q4 */}
        <div class="faq-card">
          <h4>{t("guide_faq_q4_title")}</h4>
          <p>{t("guide_faq_q4_desc")}</p>
        </div>
      </div>
    </section>
  );
};

export default FaqTab;
