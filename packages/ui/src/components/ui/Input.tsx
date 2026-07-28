import {
  type Component,
  createSignal,
  type JSX,
  Show,
  splitProps,
} from "solid-js";
import { t } from "@/core/i18n.ts";
import { CapsLockIcon, EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  rightActions?: JSX.Element;
}

export const Input: Component<InputProps> = (props) => {
  let inputRef: HTMLInputElement | undefined;
  const [isCapsLockOn, setIsCapsLockOn] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);
  let wasPassword = props.type === "password";

  const handleStepUp = () => {
    if (inputRef && !props.disabled) {
      inputRef.stepUp();
      inputRef.dispatchEvent(new Event("input", { bubbles: true }));
      inputRef.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const handleStepDown = () => {
    if (inputRef && !props.disabled) {
      inputRef.stepDown();
      inputRef.dispatchEvent(new Event("input", { bubbles: true }));
      inputRef.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const numberSpinners = (
    <div class="number-spinners">
      <button
        type="button"
        class="spinner-btn spinner-up"
        onClick={handleStepUp}
        disabled={props.disabled}
        tabindex="-1"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <button
        type="button"
        class="spinner-btn spinner-down"
        onClick={handleStepDown}
        disabled={props.disabled}
        tabindex="-1"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );

  const [local, others] = splitProps(props, [
    "class",
    "rightActions",
    "ref",
  ]);

  const checkCapsLock = (e: KeyboardEvent) => {
    if (typeof e.getModifierState === "function") {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const isPasswordInput = () => {
    if (others.type === "password") {
      wasPassword = true;
      return true;
    }
    return wasPassword;
  };

  const showWarning = () => isPasswordInput() && isCapsLockOn();

  const currentType = () => {
    if (isPasswordInput()) {
      return showPassword() ? "text" : "password";
    }
    return others.type;
  };

  const capsLockBadge = (
    <Show when={showWarning()}>
      <div class="caps-lock-badge" title={t("caps_lock_on")}>
        <CapsLockIcon />
        <span>Caps Lock</span>
      </div>
    </Show>
  );

  const eyeToggleButton = (
    <Show when={isPasswordInput()}>
      <button
        type="button"
        class="action-btn input-action-btn"
        onClick={() => setShowPassword(!showPassword())}
        title={t("login_master_password")}
        tabindex="-1"
      >
        <Show
          fallback={<EyeIcon class="icon-inline" />}
          when={showPassword()}
        >
          <EyeOffIcon class="icon-inline" />
        </Show>
      </button>
    </Show>
  );

  const builtInActions = () => (
    <>
      {capsLockBadge}
      {eyeToggleButton}
    </>
  );

  const baseRightActions = () => {
    if (local.rightActions) return local.rightActions;
    if (others.type === "number") return numberSpinners;
    return undefined;
  };

  const effectiveRightActions = () => (
    <>
      {builtInActions()}
      {baseRightActions()}
    </>
  );

  const hasActions = () =>
    !!local.rightActions || others.type === "number" || isPasswordInput();

  const inputClass = () => {
    const base = hasActions() ? "input-field" : "input-control";
    const custom = local.class || "";
    const filtered = hasActions()
      ? custom.split(" ").filter((c) => !c.startsWith("pr-") && c !== "w-100")
        .join(" ")
      : custom;
    return `${base} ${filtered}`.trim();
  };

  const wrapperClass = () => {
    const base = "input-container";
    const custom = local.class || "";
    const layoutClasses = custom.split(" ").filter((c) =>
      c === "w-100" || c.startsWith("mb-") || c.startsWith("mt-")
    ).join(" ");
    return `${base} ${layoutClasses}`.trim();
  };

  if (hasActions()) {
    return (
      <div class={wrapperClass()}>
        <input
          ref={(el) => {
            inputRef = el;
            const parentRef = local.ref;
            if (typeof parentRef === "function") {
              parentRef(el);
            }
          }}
          class={inputClass()}
          {...others}
          type={currentType()}
          onKeyDown={(e) => {
            checkCapsLock(e);
            if (typeof others.onKeyDown === "function") {
              others.onKeyDown(e);
            }
          }}
          onKeyUp={(e) => {
            checkCapsLock(e);
            if (typeof others.onKeyUp === "function") {
              others.onKeyUp(e);
            }
          }}
          onBlur={(e) => {
            setIsCapsLockOn(false);
            if (typeof others.onBlur === "function") {
              others.onBlur(e);
            }
          }}
        />
        <div class="input-actions">
          {effectiveRightActions()}
        </div>
      </div>
    );
  }

  return (
    <input
      ref={(el) => {
        inputRef = el;
        const parentRef = local.ref;
        if (typeof parentRef === "function") {
          parentRef(el);
        }
      }}
      class={inputClass()}
      {...others}
      type={currentType()}
      onKeyDown={(e) => {
        checkCapsLock(e);
        if (typeof others.onKeyDown === "function") {
          others.onKeyDown(e);
        }
      }}
      onKeyUp={(e) => {
        checkCapsLock(e);
        if (typeof others.onKeyUp === "function") {
          others.onKeyUp(e);
        }
      }}
      onBlur={(e) => {
        setIsCapsLockOn(false);
        if (typeof others.onBlur === "function") {
          others.onBlur(e);
        }
      }}
    />
  );
};

export default Input;
