import { type Component, createSignal, createEffect } from "solid-js";
import { evaluatePasswordStrength } from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";

interface PasswordStrengthMeterProps {
  password: string;
}

type StrengthLabel =
  | "pwd_strength_very_weak"
  | "pwd_strength_weak"
  | "pwd_strength_fair"
  | "pwd_strength_strong"
  | "pwd_strength_very_strong";

interface StrengthResult {
  score: number;
  label: StrengthLabel;
  className: string;
}

export const PasswordStrengthMeter: Component<PasswordStrengthMeterProps> = (
  props,
) => {
  const [strength, setStrength] = createSignal<StrengthResult>({
    score: 0,
    label: "pwd_strength_very_weak",
    className: "pwd-strength-very-weak",
  });

  createEffect(async () => {
    const res = await evaluatePasswordStrength(props.password);
    let item: StrengthResult;
    switch (res.score) {
      case 0:
        item = {
          score: 0,
          label: "pwd_strength_very_weak",
          className: "pwd-strength-very-weak",
        };
        break;
      case 1:
        item = {
          score: 1,
          label: "pwd_strength_weak",
          className: "pwd-strength-weak",
        };
        break;
      case 2:
        item = {
          score: 2,
          label: "pwd_strength_fair",
          className: "pwd-strength-fair",
        };
        break;
      case 3:
        item = {
          score: 3,
          label: "pwd_strength_strong",
          className: "pwd-strength-strong",
        };
        break;
      case 4:
      default:
        item = {
          score: 4,
          label: "pwd_strength_very_strong",
          className: "pwd-strength-very-strong",
        };
        break;
    }
    setStrength(item);
  });

  return (
    <div class="pwd-strength-container">
      <div class="pwd-strength-bar">
        <div class={`pwd-strength-progress ${strength().className}`} />
        <div class="pwd-strength-divider div-1" />
        <div class="pwd-strength-divider div-2" />
        <div class="pwd-strength-divider div-3" />
        <div class="pwd-strength-divider div-4" />
      </div>
      <div class={`pwd-strength-text ${strength().className}`}>
        {t(strength().label)}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
