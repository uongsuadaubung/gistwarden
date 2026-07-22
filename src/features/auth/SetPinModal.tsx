import { createEffect, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import Checkbox from "@/components/ui/Checkbox.tsx";

interface SetPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pin: string, requireRestart: boolean) => void;
}

export default function SetPinModal(props: SetPinModalProps) {
  const [pin, setPin] = createSignal("");
  const [requireRestart, setRequireRestart] = createSignal(true);
  const [isClosing, setIsClosing] = createSignal(false);
  const [error, setError] = createSignal("");

  createEffect(() => {
    if (props.isOpen) {
      setIsClosing(false);
      setPin("");
      setRequireRestart(true);
      setError("");
    }
  });

  const triggerClose = () => {
    if (isClosing()) return;
    setIsClosing(true);
    setTimeout(() => {
      props.onClose();
    }, 250);
  };

  const handleSave = (e: Event) => {
    e.preventDefault();
    if (isClosing()) return;
    setError("");

    const value = pin().trim();
    if (!value) {
      setError(t("settings_error_fields_required"));
      return;
    }
    if (value.length < 4) {
      setError(t("set_pin_error_length"));
      return;
    }

    setIsClosing(true);
    setTimeout(() => {
      props.onSave(value, requireRestart());
    }, 250);
  };

  return (
    <Show when={props.isOpen}>
      <div
        class={`modal-overlay bottom-slide ${isClosing() ? "is-closing" : ""}`}
        onClick={triggerClose}
      >
        <div class="modal-slide-panel" onClick={(e) => e.stopPropagation()}>
          <div class="modal-panel-header">
            <div class="modal-panel-title">{t("set_pin_title")}</div>
            <button
              type="button"
              class="modal-close-btn font-sz-16 font-w-600"
              onClick={triggerClose}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSave} class="modal-panel-body">
            <p class="m-0 text-secondary font-sz-13 lh-1_5">
              {t("set_pin_desc")}
            </p>

            <Show when={error()}>
              <div class="alert alert-danger m-0">{error()}</div>
            </Show>

            <div class="form-group pos-relative">
              <label for="set-pin-input">
                {t("set_pin_label")} <span class="text-error">*</span>
              </label>
              <div class="pos-relative d-flex align-items-center">
                <Input
                  id="set-pin-input"
                  type="password"
                  value={pin()}
                  onInput={(e) => setPin(e.currentTarget.value)}
                  placeholder={t("login_pin_placeholder")}
                  class="w-100 font-mono"
                  autofocus
                  required
                />
              </div>
            </div>

            <div class="mb-16">
              <Checkbox
                id="set-pin-require-restart"
                checked={requireRestart()}
                onChange={setRequireRestart}
                label={t("require_master_password_on_restart")}
              />
            </div>

            <div class="modal-panel-footer p-0 border-none">
              <Button
                type="submit"
                variant="primary"
              >
                {t("set_pin_title")}
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
