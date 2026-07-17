import { createEffect, createSignal, Show } from "solid-js";
import { t } from "@/shared/i18n.ts";
import { store, storeActions } from "@/shared/store.ts";
import { getMasterPassword } from "@/shared/storage.ts";
import Input from "@/components/Input.tsx";
import Button from "@/components/Button.tsx";
import { EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";

export default function RepromptModal() {
  const [password, setPassword] = createSignal("");
  const [showPassword, setShowPassword] = createSignal(false);
  const [isClosing, setIsClosing] = createSignal(false);
  const [error, setError] = createSignal("");

  createEffect(() => {
    if (store.repromptModal.isOpen) {
      setIsClosing(false);
      setPassword("");
      setShowPassword(false);
      setError("");
    }
  });

  const triggerClose = () => {
    if (isClosing()) return;
    setIsClosing(true);
    setTimeout(() => {
      storeActions.resolveReprompt(false);
    }, 250);
  };

  const handleConfirm = async (e: Event) => {
    e.preventDefault();
    if (isClosing()) return;
    setError("");

    const value = password().trim();
    if (!value) {
      setError(t("settings_error_fields_required"));
      return;
    }

    const storedPassword = await getMasterPassword();
    if (value === storedPassword) {
      setIsClosing(true);
      setTimeout(() => {
        storeActions.resolveReprompt(true);
      }, 250);
    } else {
      setError(t("login_error_wrong_mp"));
    }
  };

  return (
    <Show when={store.repromptModal.isOpen}>
      <div
        class={`modal-overlay bottom-slide ${isClosing() ? "is-closing" : ""}`}
        onClick={triggerClose}
      >
        <div class="modal-slide-panel" onClick={(e) => e.stopPropagation()}>
          <div class="modal-panel-header">
            <div class="modal-panel-title">{t("reprompt_modal_title")}</div>
            <button
              type="button"
              class="modal-close-btn font-sz-16 font-w-600"
              onClick={triggerClose}
            >
              ✕
            </button>
          </div>

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
                  type={showPassword() ? "text" : "password"}
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  placeholder={t("reprompt_modal_placeholder")}
                  class="w-100"
                  autofocus
                  required
                  rightActions={
                    <button
                      type="button"
                      class="action-btn input-action-btn"
                      onClick={() => setShowPassword(!showPassword())}
                    >
                      <Show
                        fallback={<EyeIcon class="icon-inline" />}
                        when={showPassword()}
                      >
                        <EyeOffIcon class="icon-inline" />
                      </Show>
                    </button>
                  }
                />
              </div>
            </div>

            <div class="modal-panel-footer p-0 border-none">
              <Button
                type="submit"
                variant="primary"
              >
                {t("reprompt_modal_confirm")}
              </Button>
              <Button type="button" variant="secondary" onClick={triggerClose}>
                {t("btn_cancel")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}
