import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Button from "@/components/ui/Button.tsx";
import Input from "@/components/ui/Input.tsx";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter.tsx";

interface MasterPasswordCreateProps {
  loading: boolean;
  onUnlock: (password: string) => void;
}

export const MasterPasswordCreate: Component<MasterPasswordCreateProps> = (
  props,
) => {
  const [masterPassword, setMasterPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [localError, setLocalError] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setLocalError("");
    if (masterPassword() !== confirmPassword()) {
      setLocalError(t("login_error_password_mismatch"));
      return;
    }
    props.onUnlock(masterPassword());
  };

  return (
    <form onSubmit={handleSubmit} class="card mb-0">
      <Show when={localError()}>
        <div class="alert alert-danger mb-16">{localError()}</div>
      </Show>

      <div class="form-group mb-12">
        <label for="master-password">{t("login_enter_master_password")}</label>
        <Input
          id="master-password"
          type="password"
          placeholder={t("login_placeholder_mp")}
          value={masterPassword()}
          onInput={(e) => setMasterPassword(e.currentTarget.value)}
          disabled={props.loading}
          autofocus
          required
        />
        <PasswordStrengthMeter password={masterPassword()} />
      </div>

      <div class="form-group mb-20">
        <label for="confirm-password">
          {t("login_confirm_master_password")}
        </label>
        <Input
          id="confirm-password"
          type="password"
          placeholder={t("login_placeholder_mp")}
          value={confirmPassword()}
          onInput={(e) => setConfirmPassword(e.currentTarget.value)}
          disabled={props.loading}
          required
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        block
        loading={props.loading}
        loadingText={t("login_loading_unlock")}
      >
        {t("login_btn_create_master_password")}
      </Button>
    </form>
  );
};

export default MasterPasswordCreate;
