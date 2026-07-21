import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import { EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";

export interface PinUnlockFormProps {
  error: string;
  onUnlock: (pin: string) => void;
  onSwitchToMasterPassword: () => void;
}

export const PinUnlockForm: Component<PinUnlockFormProps> = (props) => {
  const [pin, setPin] = createSignal("");
  const [showPin, setShowPin] = createSignal(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!pin().trim()) return;
    props.onUnlock(pin().trim());
  };

  return (
    <form onSubmit={handleSubmit} class="card mb-0">
      <div class="form-group pos-relative">
        <label for="pin-unlock-input">{t("login_unlock_with_pin")}</label>
        <div class="pos-relative d-flex align-items-center">
          <Input
            id="pin-unlock-input"
            type={showPin() ? "text" : "password"}
            placeholder={t("login_pin_placeholder")}
            value={pin()}
            onInput={(e) => setPin(e.currentTarget.value)}
            class="w-100 font-mono"
            autofocus
            required
            rightActions={
              <button
                type="button"
                class="action-btn input-action-btn"
                onClick={() => setShowPin(!showPin())}
              >
                <Show
                  fallback={<EyeIcon class="icon-inline" />}
                  when={showPin()}
                >
                  <EyeOffIcon class="icon-inline" />
                </Show>
              </button>
            }
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        block
        class="mb-12"
      >
        {t("login_btn_unlock")}
      </Button>

      <Button
        type="button"
        variant="secondary"
        block
        onClick={props.onSwitchToMasterPassword}
      >
        {t("login_unlock_with_mp")}
      </Button>
    </form>
  );
};

export default PinUnlockForm;
