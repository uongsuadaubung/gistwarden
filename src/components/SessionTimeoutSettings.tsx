import { type Component, createEffect, createSignal } from "solid-js";
import { t } from "../shared/i18n.ts";

interface SessionTimeoutSettingsProps {
  timeout: string;
  action: "lock" | "logout";
  onChange: (timeout: string, action: "lock" | "logout") => void;
}

export const SessionTimeoutSettings: Component<SessionTimeoutSettingsProps> = (
  props,
) => {
  const [selectedTimeout, setSelectedTimeout] = createSignal(props.timeout);
  const [selectedAction, setSelectedAction] = createSignal(props.action);

  createEffect(() => {
    setSelectedTimeout(props.timeout);
    setSelectedAction(props.action);
  });

  const handleTimeoutChange = (
    e: Event & { currentTarget: HTMLSelectElement },
  ) => {
    const val = e.currentTarget.value;
    setSelectedTimeout(val);
    props.onChange(val, selectedAction());
  };

  const handleActionChange = (
    e: Event & { currentTarget: HTMLSelectElement },
  ) => {
    const val = e.currentTarget.value;
    if (val === "lock" || val === "logout") {
      setSelectedAction(val);
      props.onChange(selectedTimeout(), val);
    }
  };

  return (
    <>
      <div class="form-group mb-16">
        <label for="timeout-select">{t("timeout_label")}</label>
        <select
          id="timeout-select"
          class="input-control w-100"
          value={selectedTimeout()}
          onChange={handleTimeoutChange}
        >
          <option value="onRestart">{t("timeout_on_restart")}</option>
          <option value="1">{t("timeout_1min")}</option>
          <option value="5">{t("timeout_5min")}</option>
          <option value="15">{t("timeout_15min")}</option>
          <option value="30">{t("timeout_30min")}</option>
          <option value="60">{t("timeout_1hr")}</option>
          <option value="240">{t("timeout_4hr")}</option>
          <option value="never">{t("timeout_never")}</option>
        </select>
      </div>

      <div class="form-group mb-0">
        <label for="timeout-action-select">
          {t("timeout_action_label")} <span class="text-error">*</span>
        </label>
        <select
          id="timeout-action-select"
          class="input-control w-100"
          value={selectedAction()}
          onChange={handleActionChange}
        >
          <option value="lock">{t("timeout_action_lock")}</option>
          <option value="logout">{t("timeout_action_logout")}</option>
        </select>
      </div>
    </>
  );
};

export default SessionTimeoutSettings;
