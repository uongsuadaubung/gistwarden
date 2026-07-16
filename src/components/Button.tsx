import { type Component, type JSX, splitProps } from "solid-js";
import { t } from "@/shared/i18n.ts";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  loadingText?: string;
  block?: boolean;
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, [
    "variant",
    "type",
    "disabled",
    "loading",
    "loadingText",
    "block",
    "onClick",
    "class",
    "children",
  ]);

  const btnClass = () => {
    const base = "btn";
    const variant = local.variant || "primary";
    const block = local.block ? "btn-block" : "";
    const custom = local.class || "";
    return `${base} btn-${variant} ${block} ${custom}`.trim();
  };

  return (
    <button
      type={local.type || "button"}
      class={btnClass()}
      disabled={local.disabled || local.loading}
      onClick={local.onClick}
      {...others}
    >
      {local.loading ? (local.loadingText || t("dialog_loading")) : local.children}
    </button>
  );
};

export default Button;
