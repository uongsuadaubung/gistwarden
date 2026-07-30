import { type Component, createSignal, For, Show } from "solid-js";
import { View } from "@gistwarden/domain";
import { navigate } from "@/core/navigation.ts";
import { t } from "@/core/i18n.ts";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { ShieldIcon, SyncIcon } from "@/icons/svg/index.ts";
import { checkEmailBreachUseCase } from "./reports-service.ts";

export const ReportDataBreach: Component = () => {
  const [emailInput, setEmailInput] = createSignal("");
  const [isChecking, setIsChecking] = createSignal(false);
  const [hasChecked, setHasChecked] = createSignal(false);
  const [checkedEmail, setCheckedEmail] = createSignal("");
  const [breaches, setBreaches] = createSignal<string[]>([]);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const handleCheckEmail = async (e?: Event) => {
    if (e) e.preventDefault();
    const email = emailInput().trim();
    if (!email) return;

    setIsChecking(true);
    setHasChecked(false);
    setErrorMessage(null);
    setBreaches([]);
    setCheckedEmail(email);

    const res = await checkEmailBreachUseCase(email);

    if (res.errorKey) {
      setErrorMessage(t(res.errorKey));
      setIsChecking(false);
      return;
    }

    setBreaches(res.breaches || []);
    setHasChecked(true);
    setIsChecking(false);
  };

  return (
    <div class="page-container report-detail-view">
      <DetailHeader
        title={t("report_databreach_title")}
        onBack={() => navigate(View.Reports)}
      />

      <p class="page-subtitle text-muted mt-2 mb-3">
        {t("report_databreach_desc")}
      </p>

      <form onSubmit={handleCheckEmail} class="card p-3 mb-4">
        <div class="form-group mb-3">
          <label class="form-label">{t("report_databreach_title")}</label>
          <input
            type="email"
            class="input-control"
            placeholder={t("report_databreach_placeholder")}
            value={emailInput()}
            onInput={(e) => setEmailInput(e.currentTarget.value)}
            required
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100 flex-center gap-2"
          disabled={isChecking() || !emailInput().trim()}
        >
          <Show when={isChecking()} fallback={<ShieldIcon />}>
            <SyncIcon class="spinning" />
          </Show>
          {isChecking()
            ? t("report_databreach_btn_checking")
            : t("report_databreach_btn_check")}
        </button>
      </form>

      <Show when={errorMessage()}>
        <div class="alert alert-warning mb-3">{errorMessage()}</div>
      </Show>

      <Show when={hasChecked() && !isChecking()}>
        <Show
          when={breaches().length > 0}
          fallback={
            <div class="empty-state text-center p-4 card">
              <div class="empty-state-icon text-success mb-2">
                <ShieldIcon />
              </div>
              <p class="text-success fw-medium">
                {t("report_databreach_clean_msg")}
              </p>
            </div>
          }
        >
          <div class="card p-3">
            <div class="alert alert-danger mb-3">
              {t("report_databreach_found_title").replace(
                "{email}",
                checkedEmail(),
              )}
            </div>

            <div class="breach-list">
              <For each={breaches()}>
                {(siteName) => (
                  <div class="breach-item p-2 mb-2 card flex-align-center gap-2 border-left-danger">
                    <span class="text-danger fw-bold">🏢 {siteName}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default ReportDataBreach;
