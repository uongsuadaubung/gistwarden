import { type Component, Show } from "solid-js";

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  class?: string;
  disabled?: boolean;
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
    >
      <div class="checkbox-row">
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
      <Show when={props.description}>
        <div class="checkbox-description">
          {props.description}
        </div>
      </Show>
    </div>
  );
};

export default Checkbox;
