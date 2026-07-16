import { type Component, Show } from "solid-js";
import { store, storeActions, View } from "@/shared/store.ts";
import { ArrowLeftIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";

export const Theme: Component = () => {
  const handleBack = () => {
    storeActions.navigate(View.Settings);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <div
          class="detail-header"
          style="margin-top: 0; margin-bottom: 16px;"
        >
          <div class="back-btn" onClick={handleBack}>
            <ArrowLeftIcon />
          </div>
          <div class="detail-title">{t("settings_theme_label")}</div>
        </div>

        <div class="card card-list">
          <div
            class="setting-row"
            style="cursor: pointer;"
            onClick={() => {
              storeActions.updateTheme("dark");
              storeActions.navigate(View.Settings);
            }}
          >
            <div class="setting-row-left">
              <span style="font-size: 14px;">{t("settings_theme_dark")}</span>
            </div>
            <Show when={store.theme === "dark"}>
              <svg
                class="check-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="width: 16px; height: 16px; color: var(--primary-accent);"
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
            style="cursor: pointer;"
            onClick={() => {
              storeActions.updateTheme("light");
              storeActions.navigate(View.Settings);
            }}
          >
            <div class="setting-row-left">
              <span style="font-size: 14px;">{t("settings_theme_light")}</span>
            </div>
            <Show when={store.theme === "light"}>
              <svg
                class="check-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="width: 16px; height: 16px; color: var(--primary-accent);"
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
