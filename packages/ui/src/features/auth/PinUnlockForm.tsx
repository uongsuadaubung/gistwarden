import { type Component, createSignal } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";

export interface PinUnlockFormProps {
  error: string;
  onUnlock: (pin: string) => void;
  onSwitchToMasterPassword: () => void;
}

export const PinUnlockForm: Component<PinUnlockFormProps> = (props) => {
  const [pin, setPin] = createSignal("");

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
            type="password"
            placeholder={t("login_pin_placeholder")}
            value={pin()}
            onInput={(e) => setPin(e.currentTarget.value)}
            class="w-100 font-mono"
            autofocus
            required
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
