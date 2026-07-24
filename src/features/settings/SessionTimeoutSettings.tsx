import { type Component, createEffect, createSignal } from "solid-js";
import { t } from "@/core/i18n.ts";
import Select from "@/components/ui/Select.tsx";
import {
  type VaultTimeoutAction,
  VaultTimeoutActionSchema,
  type VaultTimeoutValue,
  VaultTimeoutValueSchema,
} from "@/core/types.ts";

interface SessionTimeoutSettingsProps {
  timeout: VaultTimeoutValue;
  action: VaultTimeoutAction;
  onChange: (timeout: VaultTimeoutValue, action: VaultTimeoutAction) => void;
}

export const SessionTimeoutSettings: Component<SessionTimeoutSettingsProps> = (
  props,
) => {
  const [selectedTimeout, setSelectedTimeout] = createSignal<VaultTimeoutValue>(
    props.timeout,
  );
  const [selectedAction, setSelectedAction] = createSignal<VaultTimeoutAction>(
    props.action,
  );

  const timeoutOptions = () => [
    { value: "onSystemLock", label: t("timeout_on_system_lock") },
    { value: "onRestart", label: t("timeout_on_restart") },
    { value: "1", label: t("timeout_1min") },
    { value: "5", label: t("timeout_5min") },
    { value: "15", label: t("timeout_15min") },
    { value: "30", label: t("timeout_30min") },
    { value: "60", label: t("timeout_1hr") },
    { value: "240", label: t("timeout_4hr") },
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
    const parsed = VaultTimeoutValueSchema.safeParse(e.currentTarget.value);
    if (parsed.success) {
      setSelectedTimeout(parsed.data);
      props.onChange(parsed.data, selectedAction());
    }
  };

  const handleActionChange = (
    e: { currentTarget: { value: string } },
  ) => {
    const parsed = VaultTimeoutActionSchema.safeParse(e.currentTarget.value);
    if (parsed.success) {
      setSelectedAction(parsed.data);
      props.onChange(selectedTimeout(), parsed.data);
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
