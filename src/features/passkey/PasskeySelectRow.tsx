import { type Component, type JSX, Show } from "solid-js";

interface PasskeySelectRowProps {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
  subItem?: boolean;
}

export const PasskeySelectRow: Component<PasskeySelectRowProps> = (props) => {
  return (
    <div
      class={`passkey-item ${props.subItem ? "sub-item" : ""} ${
        props.active ? "active" : ""
      }`}
      onClick={props.onClick}
    >
      <div class="passkey-item-icon">{props.icon}</div>
      <div class="passkey-item-details">
        <div class="passkey-username">{props.title}</div>
        <div class="passkey-vault-name">{props.subtitle}</div>
      </div>
      <div class="passkey-checkbox">
        <div class="circle-check">
          <Show when={props.active}>
            <div class="check-dot"></div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default PasskeySelectRow;
