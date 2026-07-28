import { type Component } from "solid-js";
import { settingsStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { updateExtensionSettings } from "@/core/storage.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import { ChevronRightIcon, GlobeIcon, ThemeIcon } from "@/icons/svg/index.ts";

export const Appearance: Component = () => {
  const handleBack = () => {
    navigate(View.Settings);
  };

  const handleAnimationsToggle = async (checked: boolean) => {
    await updateExtensionSettings({ enablePageAnimations: checked });
  };

  return (
    <div class="app-container">
      <div class="app-body pb-24">
        {/* Header */}
        <DetailHeader
          title={t("settings_appearance_label")}
          onBack={handleBack}
        />

        <div class="card card-list">
          {/* Language Settings */}
          <div
            class="setting-row"
            onClick={() => navigate(View.Language)}
          >
            <div class="setting-row-left">
              <GlobeIcon />
              <div>
                <div class="setting-label">
                  {t("settings_label_language")}
                </div>
                <div class="setting-sub">
                  {settingsStore.language === "vi" ? "Tiếng Việt" : "English"}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Theme Settings */}
          <div
            class="setting-row"
            onClick={() => navigate(View.Theme)}
          >
            <div class="setting-row-left">
              <ThemeIcon />
              <div>
                <div class="setting-label">
                  {t("settings_theme_label")}
                </div>
                <div class="setting-sub">
                  {t("settings_theme_sub", {
                    theme: settingsStore.theme === "dark"
                      ? t("settings_theme_dark")
                      : t("settings_theme_light"),
                  })}
                </div>
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>

        {/* Page Animations Section */}
        <div class="detail-section-title mt-20">
          {t("settings_enable_animations_label")}
        </div>
        <div class="card p-16">
          <Checkbox
            id="appearance-enable-animations"
            checked={settingsStore.enablePageAnimations}
            onChange={handleAnimationsToggle}
            label={t("settings_enable_animations_label")}
            description={t("settings_enable_animations_sub")}
          />
        </div>
      </div>
    </div>
  );
};

export default Appearance;
