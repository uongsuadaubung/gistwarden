import { type Component, type JSX, splitProps } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  rightActions?: JSX.Element;
}

export const Input: Component<InputProps> = (props) => {
  let inputRef: HTMLInputElement | undefined;

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

  const [local, others] = splitProps(props, ["class", "rightActions", "ref"]);

  const effectiveRightActions = () => {
    if (local.rightActions) return local.rightActions;
    if (others.type === "number") return numberSpinners;
    return undefined;
  };

  const hasActions = () => !!effectiveRightActions();

  const inputClass = () => {
    const base = hasActions() ? "input-field" : "input-control";
    const custom = local.class || "";
    const filtered = hasActions()
      ? custom.split(" ").filter((c) => !c.startsWith("pr-") && c !== "w-100")
        .join(" ")
      : custom;
    return `${base} ${filtered}`.trim();
  };

  if (hasActions()) {
    const wrapperClass = () => {
      const base = "input-container";
      const custom = local.class || "";
      const layoutClasses = custom.split(" ").filter((c) =>
        c === "w-100" || c.startsWith("mb-") || c.startsWith("mt-")
      ).join(" ");
      return `${base} ${layoutClasses}`.trim();
    };

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
    />
  );
};

export default Input;
