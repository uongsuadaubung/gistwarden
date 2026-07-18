import { type Component, Show } from "solid-js";
import { store } from "@/shared/store.ts";
import { View } from "@/shared/types.ts";
import { navigate } from "@/shared/navigation.ts";
import { updateLanguage } from "@/shared/ui-service.ts";
import { t } from "@/shared/i18n.ts";
import DetailHeader from "@/components/DetailHeader.tsx";

export const Language: Component = () => {
  const handleBack = () => {
    navigate(View.Appearance);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("settings_label_language")}
          onBack={handleBack}
        />

        <div class="card card-list">
          <div
            class="setting-row"
            onClick={() => {
              updateLanguage("en");
              navigate(View.Appearance);
            }}
          >
            <div class="setting-row-left">
              <span class="font-sz-14">{t("settings_lang_en")}</span>
            </div>
            <Show when={store.language === "en"}>
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
              updateLanguage("vi");
              navigate(View.Appearance);
            }}
          >
            <div class="setting-row-left">
              <span class="font-sz-14">{t("settings_lang_vi")}</span>
            </div>
            <Show when={store.language === "vi"}>
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

export default Language;
