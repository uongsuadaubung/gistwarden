import { type Component } from "solid-js";
import { store } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { updateSettings } from "@/core/storage.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";

export const AutofillOptions: Component = () => {
  const handleBack = () => {
    navigate(View.Settings);
  };

  const handleAutoSubmitToggle = async (checked: boolean) => {
    await updateSettings({ autoSubmitOnAutofill: checked });
  };

  const handleShowSuggestionsToggle = async (checked: boolean) => {
    await updateSettings({ showAutofillSuggestionsOnFocus: checked });
  };

  const isAutoSubmitEnabled = () => store.autoSubmitOnAutofill;
  const isShowSuggestionsEnabled = () => store.showAutofillSuggestionsOnFocus;

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
        <div class="card p-16 mb-20 d-flex flex-column gap-8">
          <Checkbox
            id="autofill-show-suggestions"
            checked={isShowSuggestionsEnabled()}
            onChange={handleShowSuggestionsToggle}
            label={t("show_autofill_suggestions_label")}
          />
          <div class="font-sz-12 text-secondary pl-28 mb-12">
            {t("show_autofill_suggestions_sub")}
          </div>

          <Checkbox
            id="autofill-auto-submit"
            checked={isAutoSubmitEnabled()}
            onChange={handleAutoSubmitToggle}
            label={t("auto_submit_on_autofill_label")}
          />
          <div class="font-sz-12 text-secondary pl-28">
            {t("auto_submit_on_autofill_sub")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutofillOptions;
