import { type Component, type JSX, splitProps } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  rightActions?: JSX.Element;
}

export const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "rightActions"]);

  const inputClass = () => {
    const base = local.rightActions ? "input-field" : "input-control";
    const custom = local.class || "";
    // Bỏ các class padding-right cứng nếu có rightActions
    const filtered = local.rightActions
      ? custom.split(" ").filter((c) => !c.startsWith("pr-") && c !== "w-100")
        .join(" ")
      : custom;
    return `${base} ${filtered}`.trim();
  };

  if (local.rightActions) {
    const wrapperClass = () => {
      const base = "input-container";
      const custom = local.class || "";
      // w-100 và các class margin ngoài (mb-, mt-, etc.) nên được áp dụng ở wrapper
      const layoutClasses = custom.split(" ").filter((c) =>
        c === "w-100" || c.startsWith("mb-") || c.startsWith("mt-")
      ).join(" ");
      return `${base} ${layoutClasses}`.trim();
    };

    return (
      <div class={wrapperClass()}>
        <input
          class={inputClass()}
          {...others}
        />
        <div class="input-actions">
          {local.rightActions}
        </div>
      </div>
    );
  }

  return (
    <input
      class={inputClass()}
      {...others}
    />
  );
};

export default Input;
