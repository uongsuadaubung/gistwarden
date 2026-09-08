import {
  DEFAULT_EXCLUDED_DOMAINS,
  updateExtensionSettingsUseCase,
} from "@gistwarden/orchestrator";
import { type Component, createSignal, For, Show } from "solid-js";
import Button from "@/components/ui/Button.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import Input from "@/components/ui/Input.tsx";
import { t } from "@/core/i18n.ts";
import { goBack, navigate } from "@/core/navigation.ts";
import { setSettingsStore, settingsStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { PlusIcon, TrashIcon } from "@/icons/svg/index.ts";

export const AutofillOptions: Component = () => {
  const [newDomain, setNewDomain] = createSignal("");

  const handleBack = () => {
    goBack(View.Settings);
  };

  const handleAutoSubmitToggle = async (checked: boolean) => {
    setSettingsStore("autoSubmitOnAutofill", checked);
    await updateExtensionSettingsUseCase({ autoSubmitOnAutofill: checked });
  };

  const handleAutoCopyTotpToggle = async (checked: boolean) => {
    setSettingsStore("autoCopyTotp", checked);
    await updateExtensionSettingsUseCase({ autoCopyTotp: checked });
  };

  const handleShowSuggestionsToggle = async (checked: boolean) => {
    if (!checked) {
      setSettingsStore({
        showAutofillSuggestionsOnFocus: false,
        autoSubmitOnAutofill: false,
      });
      await updateExtensionSettingsUseCase({
        showAutofillSuggestionsOnFocus: false,
        autoSubmitOnAutofill: false,
      });
    } else {
      setSettingsStore("showAutofillSuggestionsOnFocus", true);
      await updateExtensionSettingsUseCase({
        showAutofillSuggestionsOnFocus: true,
      });
    }
  };

  const excludedDomains = () => settingsStore.excludedDomains || [];

  const isDefaultDomain = (domain: string) =>
    DEFAULT_EXCLUDED_DOMAINS.includes(domain.toLowerCase().trim());

  const handleAddDomain = async () => {
    const raw = newDomain().trim();
    if (!raw) return;
    const clean = raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!clean) return;

    const current = [...excludedDomains()];
    if (!current.includes(clean)) {
      const updated = [...current, clean];
      setSettingsStore("excludedDomains", updated);
      await updateExtensionSettingsUseCase({ excludedDomains: updated });
    }
    setNewDomain("");
  };

  const handleRemoveDomain = async (domain: string) => {
    if (isDefaultDomain(domain)) return;
    const updated = excludedDomains().filter((d) => d !== domain);
    setSettingsStore("excludedDomains", updated);
    await updateExtensionSettingsUseCase({ excludedDomains: updated });
  };

  const isShowSuggestionsEnabled = () =>
    settingsStore.showAutofillSuggestionsOnFocus;
  const isAutoSubmitEnabled = () => settingsStore.autoSubmitOnAutofill;
  const isAutoCopyTotpEnabled = () => settingsStore.autoCopyTotp;

  return (
    <div class="app-container">
      <div class="app-body pb-24">
        <DetailHeader title={t("autofill_options_title")} onBack={handleBack} />

        <div class="detail-section-title mt-0">
          {t("autofill_options_header")}
        </div>
        <div class="card p-16 mb-20 d-flex flex-column gap-16">
          <Checkbox
            id="autofill-auto-copy-totp"
            checked={isAutoCopyTotpEnabled()}
            onChange={handleAutoCopyTotpToggle}
            label={t("auto_copy_totp_label")}
            description={t("auto_copy_totp_sub")}
          />

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

        {/* Excluded Domains Section */}
        <div class="detail-section-title">
          {t("autofill_excluded_domains_title")}
        </div>
        <div class="card p-16 mb-20 d-flex flex-column gap-16">
          <p class="m-0 font-sz-13 text-secondary lh-1_5">
            {t("autofill_excluded_domains_sub")}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDomain();
            }}
            class="excluded-domain-form"
          >
            <div class="excluded-input-wrapper">
              <Input
                id="new-excluded-domain-input"
                type="text"
                value={newDomain()}
                onInput={(e) => setNewDomain(e.currentTarget.value)}
                placeholder={t("autofill_excluded_domain_placeholder")}
                class="w-100 font-mono"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!newDomain().trim()}
              class="excluded-add-btn"
            >
              <PlusIcon /> {t("autofill_btn_add_domain")}
            </Button>
          </form>

          <div class="excluded-domains-list">
            <For each={excludedDomains()}>
              {(domain) => (
                <div class="excluded-domain-item">
                  <div class="d-flex align-items-center gap-8 min-w-0">
                    <span class="excluded-domain-name">{domain}</span>
                    <Show when={isDefaultDomain(domain)}>
                      <span class="excluded-domain-tag">
                        {t("autofill_excluded_domain_default_tag")}
                      </span>
                    </Show>
                  </div>
                  <Show when={!isDefaultDomain(domain)}>
                    <button
                      type="button"
                      class="excluded-domain-remove-btn"
                      title={t("btn_delete")}
                      onClick={() => handleRemoveDomain(domain)}
                    >
                      <TrashIcon />
                    </button>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutofillOptions;
