import { type Component, createSignal, Show } from "solid-js";
import { View } from "@/core/types.ts";
import { navigate } from "@/core/navigation.ts";
import { changeMasterPassword } from "@/features/auth/master-password-service.ts";
import { setGlobalLoading, showToast } from "@/core/ui-service.ts";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter.tsx";

export const ChangeMasterPassword: Component = () => {
  const [error, setError] = createSignal("");
  const [currentPassword, setCurrentPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleBack = () => {
    navigate(View.AccountSecurity);
  };

  const handleChangePassword = async (e: Event) => {
    e.preventDefault();
    if (!currentPassword() || !newPassword() || !confirmPassword()) {
      setError(t("settings_error_fields_required"));
      return;
    }
    if (newPassword() !== confirmPassword()) {
      setError(t("settings_error_mp_mismatch"));
      return;
    }

    setLoading(true);
    setGlobalLoading(true);
    setError("");
    const result = await changeMasterPassword(
      currentPassword(),
      newPassword(),
    );
    setGlobalLoading(false);
    setLoading(false);

    if (result.isOk()) {
      showToast(
        t("settings_mp_success"),
        "success",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate(View.AccountSecurity);
    } else {
      setError(t(result.error));
    }
  };

  return (
    <div class="app-container">
      <div class="app-body pb-24">
        {/* Change Password Form View */}
        <DetailHeader
          title={t("settings_change_mp_title")}
          onBack={handleBack}
        />

        <Show when={error()}>
          <div class="alert alert-danger mb-16">{error()}</div>
        </Show>

        <form
          onSubmit={handleChangePassword}
          class="card p-16 m-0"
        >
          <div class="form-group mb-12">
            <label for="current-pass">
              {t("settings_change_mp_current")}
            </label>
            <Input
              id="current-pass"
              type="password"
              value={currentPassword()}
              onInput={(e) => setCurrentPassword(e.currentTarget.value)}
              placeholder={t("settings_change_mp_current") + "..."}
              disabled={loading()}
              required
            />
          </div>

          <div class="form-group mb-12">
            <label for="new-pass">{t("settings_change_mp_new")}</label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword()}
              onInput={(e) => setNewPassword(e.currentTarget.value)}
              placeholder={t("settings_change_mp_new") + "..."}
              disabled={loading()}
              required
            />
            <PasswordStrengthMeter password={newPassword()} />
          </div>

          <div class="form-group mb-20">
            <label for="confirm-pass">
              {t("settings_change_mp_confirm")}
            </label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword()}
              onInput={(e) => setConfirmPassword(e.currentTarget.value)}
              placeholder={t("settings_change_mp_confirm") + "..."}
              disabled={loading()}
              required
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              loading={loading()}
              loadingText={t("dialog_loading")}
            >
              {t("btn_save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeMasterPassword;
