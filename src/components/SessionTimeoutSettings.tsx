import { type Component, createEffect, createSignal } from "solid-js";
import { t } from "../shared/i18n.ts";
import Select from "./Select.tsx";

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

  const timeoutOptions = () => [
    { value: "onRestart", label: t("timeout_on_restart") },
    { value: "1", label: t("timeout_1min") },
    { value: "5", label: t("timeout_5min") },
    { value: "15", label: t("timeout_15min") },
    { value: "30", label: t("timeout_30min") },
    { value: "60", label: t("timeout_1hr") },
    { value: "240", label: t("timeout_4hr") },
    { value: "never", label: t("timeout_never") },
  ];

  const actionOptions = () => [
    { value: "lock", label: t("timeout_action_lock") },
    { value: "logout", label: t("timeout_action_logout") },
  ];

  createEffect(() => {
    setSelectedTimeout(props.timeout);
    setSelectedAction(props.action);
  });

  const handleTimeoutChange = (
    e: { currentTarget: { value: string } },
  ) => {
    const val = e.currentTarget.value;
    setSelectedTimeout(val);
    props.onChange(val, selectedAction());
  };

  const handleActionChange = (
    e: { currentTarget: { value: string } },
  ) => {
    const val = e.currentTarget.value;
    if (val === "lock" || val === "logout") {
      const actionVal: "lock" | "logout" = val;
      setSelectedAction(actionVal);
      props.onChange(selectedTimeout(), actionVal);
    }
  };

  return (
    <>
      <div class="form-group mb-16">
        <label for="timeout-select">{t("timeout_label")}</label>
        <Select
          id="timeout-select"
          class="w-100"
          value={selectedTimeout()}
          onChange={handleTimeoutChange}
          options={timeoutOptions()}
        />
      </div>

      <div class="form-group mb-0">
        <label for="timeout-action-select">
          {t("timeout_action_label")} <span class="text-error">*</span>
        </label>
        <Select
          id="timeout-action-select"
          class="w-100"
          value={selectedAction()}
          onChange={handleActionChange}
          options={actionOptions()}
        />
      </div>
    </>
  );
};

export default SessionTimeoutSettings;
