import { createEffect, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { uiStore } from "@/core/store.ts";
import { resolveReprompt } from "@gistwarden/ui";
import { verifyMasterPassword } from "@gistwarden/orchestrator";
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import BaseSlideModal from "@/components/ui/BaseSlideModal.tsx";

export default function RepromptModal() {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");

  createEffect(() => {
    if (uiStore.repromptModal.isOpen) {
      setPassword("");
      setError("");
    }
  });

  return (
    <BaseSlideModal
      isOpen={uiStore.repromptModal.isOpen}
      onClose={() => resolveReprompt(false)}
      title={t("reprompt_modal_title")}
    >
      {(triggerClose) => {
        const handleConfirm = async (e: Event) => {
          e.preventDefault();
          setError("");

          const value = password().trim();
          if (!value) {
            setError(t("settings_error_fields_required"));
            return;
          }

          const isCorrect = await verifyMasterPassword(value);
          if (isCorrect) {
            triggerClose(() => {
              resolveReprompt(true);
            });
          } else {
            setError(t("login_error_wrong_mp"));
          }
        };

        return (
          <form onSubmit={handleConfirm} class="modal-panel-body">
            <p class="m-0 text-secondary font-sz-13 lh-1_5">
              {t("reprompt_modal_desc")}
            </p>

            <Show when={error()}>
              <div class="alert alert-danger m-0">{error()}</div>
            </Show>

            <div class="form-group pos-relative">
              <label for="reprompt-password-input">
                {t("reprompt_modal_label")} <span class="text-error">*</span>
              </label>
              <div class="pos-relative d-flex align-items-center">
                <Input
                  id="reprompt-password-input"
                  type="password"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  placeholder={t("reprompt_modal_placeholder")}
                  class="w-100"
                  autofocus
                  required
                />
              </div>
            </div>

            <div class="modal-panel-footer p-0 border-none">
              <Button type="submit" variant="primary">
                {t("reprompt_modal_confirm")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => triggerClose()}
              >
                {t("btn_cancel")}
              </Button>
            </div>
          </form>
        );
      }}
    </BaseSlideModal>
  );
}
