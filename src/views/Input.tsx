import { type Component, splitProps, type JSX } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  // Thêm các thuộc tính tùy chỉnh nếu cần thiết trong tương lai
}

export const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ["class"]);

  const inputClass = () => {
    const base = "input-control";
    const custom = local.class || "";
    return `${base} ${custom}`.trim();
  };

  return (
    <input
      class={inputClass()}
      {...others}
    />
  );
};

export default Input;
