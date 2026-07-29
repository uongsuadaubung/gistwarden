import { type Component, Show } from "solid-js";
import { setSettingsStore, settingsStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { updateExtensionSettings } from "@/core/storage.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";

export const AutofillOptions: Component = () => {
  const handleBack = () => {
    navigate(View.Settings);
  };

  const handleAutoSubmitToggle = async (checked: boolean) => {
    setSettingsStore("autoSubmitOnAutofill", checked);
    await updateExtensionSettings({ autoSubmitOnAutofill: checked });
  };

  const handleShowSuggestionsToggle = async (checked: boolean) => {
    if (!checked) {
      setSettingsStore({
        showAutofillSuggestionsOnFocus: false,
        autoSubmitOnAutofill: false,
      });
      await updateExtensionSettings({
        showAutofillSuggestionsOnFocus: false,
        autoSubmitOnAutofill: false,
      });
    } else {
      setSettingsStore("showAutofillSuggestionsOnFocus", true);
      await updateExtensionSettings({ showAutofillSuggestionsOnFocus: true });
    }
  };

  const isShowSuggestionsEnabled = () =>
    settingsStore.showAutofillSuggestionsOnFocus;
  const isAutoSubmitEnabled = () => settingsStore.autoSubmitOnAutofill;

  return (
    <div class="app-container">
      <div class="app-body pb-24">
        <DetailHeader
          title={t("autofill_options_title")}
          onBack={handleBack}
        />

        <div class="detail-section-title mt-0">
          {t("autofill_options_header")}
        </div>
        <div class="card p-16 mb-20 d-flex flex-column gap-16">
          <Checkbox
            id="autofill-show-suggestions"
            checked={isShowSuggestionsEnabled()}
            onChange={handleShowSuggestionsToggle}
            label={t("show_autofill_suggestions_label")}
            description={t("show_autofill_suggestions_sub")}
          />

          <Show when={isShowSuggestionsEnabled()}>
            <div class="pl-24">
              <Checkbox
                id="autofill-auto-submit"
                checked={isAutoSubmitEnabled()}
                onChange={handleAutoSubmitToggle}
                label={t("auto_submit_on_autofill_label")}
                description={t("auto_submit_on_autofill_sub")}
              />
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default AutofillOptions;
