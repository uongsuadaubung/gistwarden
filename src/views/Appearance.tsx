import { type Component } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";
import { ChevronRightIcon, GlobeIcon, ThemeIcon } from "@/icons/svg/index.ts";

export const Appearance: Component = () => {
  const handleBack = () => {
    storeActions.navigate(View.Settings);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_appearance_label")}
          onBack={handleBack}
        />

        <div class="card card-list">
          {/* Language Settings */}
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.Language)}
          >
            <div class="setting-row-left">
              <GlobeIcon />
              <div>
                <div class="setting-label">
                  {t("settings_label_language")}
                </div>
                <div class="setting-sub">
                  {store.language === "vi" ? "Tiếng Việt" : "English"}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Theme Settings */}
          <div
            class="setting-row"
            onClick={() => storeActions.navigate(View.Theme)}
          >
            <div class="setting-row-left">
              <ThemeIcon />
              <div>
                <div class="setting-label">
                  {t("settings_theme_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_theme_sub", {
                    theme: store.theme === "dark"
                      ? t("settings_theme_dark")
                      : t("settings_theme_light"),
                  })}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
