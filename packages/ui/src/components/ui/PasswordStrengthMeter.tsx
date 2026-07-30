import { type Component, createMemo } from "solid-js";
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
  const strength = createMemo<StrengthResult>(() => {
    const res = evaluatePasswordStrength(props.password);
    switch (res.score) {
      case 0:
        return {
          score: 0,
          label: "pwd_strength_very_weak",
          className: "pwd-strength-very-weak",
        };
      case 1:
        return {
          score: 1,
          label: "pwd_strength_weak",
          className: "pwd-strength-weak",
        };
      case 2:
        return {
          score: 2,
          label: "pwd_strength_fair",
          className: "pwd-strength-fair",
        };
      case 3:
        return {
          score: 3,
          label: "pwd_strength_strong",
          className: "pwd-strength-strong",
        };
      case 4:
      default:
        return {
          score: 4,
          label: "pwd_strength_very_strong",
          className: "pwd-strength-very-strong",
        };
    }
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
