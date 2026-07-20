import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Button from "@/components/ui/Button.tsx";
import Input from "@/components/ui/Input.tsx";
import { store } from "@/core/store.ts";

interface MasterPasswordFormProps {
  loading: boolean;
  onUnlock: (password: string) => void;
  onSwitchToPin: () => void;
  onLogout: () => void;
  onForgotPassword: () => void;
}

export const MasterPasswordForm: Component<MasterPasswordFormProps> = (
  props,
) => {
  const [masterPassword, setMasterPassword] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    props.onUnlock(masterPassword());
  };

  return (
    <form onSubmit={handleSubmit} class="card mb-0">
      <div class="form-group">
        <label for="master-password">{t("login_master_password")}</label>
        <Input
          id="master-password"
          type="password"
          placeholder={t("login_placeholder_mp")}
          value={masterPassword()}
          onInput={(e) => setMasterPassword(e.currentTarget.value)}
          disabled={props.loading}
          autofocus
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        block
        loading={props.loading}
        loadingText={t("login_loading_unlock")}
        class="mb-12"
      >
        {t("login_btn_unlock")}
      </Button>

      <Show
        when={store.pinUnlockEnabled &&
          !(store.requireMasterPasswordOnRestart && !store.sessionUnlocked)}
      >
        <Button
          type="button"
          variant="secondary"
          block
          onClick={() => props.onSwitchToPin()}
          disabled={props.loading}
          class="mb-12"
        >
          {t("login_unlock_with_pin")}
        </Button>
      </Show>

      <div class="login-or-divider">
        <span>{t("login_or")}</span>
      </div>

      <Button
        type="button"
        variant="secondary"
        block
        onClick={() => props.onLogout()}
        disabled={props.loading}
      >
        {t("settings_logout_title")}
      </Button>

      <div class="mt-16 text-center">
        <a
          href="#"
          class="forgot-pass-link"
          onClick={(e) => {
            e.preventDefault();
            props.onForgotPassword();
          }}
        >
          {t("login_forgot_password")}
        </a>
      </div>
    </form>
  );
};
