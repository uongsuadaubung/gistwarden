import { type Component, Show } from "solid-js";
import { store } from "@/core/store.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { ThemeMode, View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { updateTheme } from "@/core/ui-service.ts";
import { MoonIcon, SunIcon } from "@/icons/svg/index.ts";

export const Theme: Component = () => {
  const handleBack = () => {
    navigate(View.Appearance);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader title={t("settings_theme_label")} onBack={handleBack} />

        <div class="card card-list">
          <div
            class="setting-row"
            onClick={() => {
              updateTheme(ThemeMode.Dark);
              navigate(View.Appearance);
            }}
          >
            <div class="setting-row-left d-flex align-center gap-8">
              <MoonIcon width="20" height="20" />
              <span class="font-sz-14">{t("settings_theme_dark")}</span>
            </div>
            <Show when={store.theme === ThemeMode.Dark}>
              <svg
                class="check-icon lang-option-check"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </Show>
          </div>

          <div
            class="setting-row"
            onClick={() => {
              updateTheme(ThemeMode.Light);
              navigate(View.Appearance);
            }}
          >
            <div class="setting-row-left d-flex align-center gap-8">
              <SunIcon width="20" height="20" />
              <span class="font-sz-14">{t("settings_theme_light")}</span>
            </div>
            <Show when={store.theme === ThemeMode.Light}>
              <svg
                class="check-icon lang-option-check"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Theme;
