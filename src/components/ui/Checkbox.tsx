import { type Component, type JSX, Show } from "solid-js";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  class?: string;
  disabled?: boolean;
  style?: JSX.CSSProperties;
}

export const Checkbox: Component<CheckboxProps> = (props) => {
  const handleChange = (e: Event & { currentTarget: HTMLInputElement }) => {
    const target = e.currentTarget;
    const oldChecked = props.checked;
    props.onChange(target.checked);
    if (props.checked === oldChecked) {
      target.checked = oldChecked;
    }
  };

  return (
    <div
      class={`checkbox-container ${props.class || ""}`}
      style={props.style}
    >
      <input
        id={props.id}
        type="checkbox"
        checked={props.checked}
        onChange={handleChange}
        disabled={props.disabled}
        class="checkbox-control"
      />
      <Show when={props.label}>
        <label
          for={props.id}
          class={`checkbox-label ${props.disabled ? "disabled" : ""}`}
        >
          {props.label}
        </label>
      </Show>
    </div>
  );
};

export default Checkbox;
