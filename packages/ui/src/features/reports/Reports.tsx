import { type Component } from "solid-js";
import { View } from "@gistwarden/domain";
import { navigate } from "@/core/navigation.ts";
import { t } from "@/core/i18n.ts";
import { Header } from "@/components/ui/Header.tsx";
import {
  GlobeIcon,
  InfoIcon,
  KeyIcon,
  LockIcon,
  ShieldIcon,
} from "@/icons/svg/index.ts";

export const Reports: Component = () => {
  return (
    <div class="app-container">
      <Header title={t("reports_title")} />
      <div class="app-body reports-view">
        <div class="page-header text-center mt-2">
          <p class="page-subtitle text-muted">{t("reports_subtitle")}</p>
        </div>

        <div class="reports-grid mt-2">
          {/* 1. Exposed Passwords */}
          <div
            class="report-card"
            onClick={() => navigate(View.ReportExposed)}
          >
            <div class="report-card-icon">
              <ShieldIcon />
            </div>
            <div class="report-card-content">
              <h3 class="report-card-title">{t("report_exposed_title")}</h3>
              <p class="report-card-desc">{t("report_exposed_desc")}</p>
            </div>
          </div>

          {/* 2. Reused Passwords */}
          <div
            class="report-card"
            onClick={() => navigate(View.ReportReused)}
          >
            <div class="report-card-icon">
              <KeyIcon />
            </div>
            <div class="report-card-content">
              <h3 class="report-card-title">{t("report_reused_title")}</h3>
              <p class="report-card-desc">{t("report_reused_desc")}</p>
            </div>
          </div>

          {/* 3. Weak Passwords */}
          <div
            class="report-card"
            onClick={() => navigate(View.ReportWeak)}
          >
            <div class="report-card-icon">
              <InfoIcon />
            </div>
            <div class="report-card-content">
              <h3 class="report-card-title">{t("report_weak_title")}</h3>
              <p class="report-card-desc">{t("report_weak_desc")}</p>
            </div>
          </div>

          {/* 4. Unsecure Websites */}
          <div
            class="report-card"
            onClick={() => navigate(View.ReportUnsecure)}
          >
            <div class="report-card-icon">
              <GlobeIcon />
            </div>
            <div class="report-card-content">
              <h3 class="report-card-title">{t("report_unsecure_title")}</h3>
              <p class="report-card-desc">{t("report_unsecure_desc")}</p>
            </div>
          </div>

          {/* 5. Inactive 2FA */}
          <div
            class="report-card"
            onClick={() => navigate(View.ReportInactive2FA)}
          >
            <div class="report-card-icon">
              <LockIcon />
            </div>
            <div class="report-card-content">
              <h3 class="report-card-title">
                {t("report_inactive_2fa_title")}
              </h3>
              <p class="report-card-desc">{t("report_inactive_2fa_desc")}</p>
            </div>
          </div>

          {/* 6. Data Breach */}
          <div
            class="report-card"
            onClick={() => navigate(View.ReportDataBreach)}
          >
            <div class="report-card-icon">
              <ShieldIcon />
            </div>
            <div class="report-card-content">
              <h3 class="report-card-title">{t("report_databreach_title")}</h3>
              <p class="report-card-desc">{t("report_databreach_desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
