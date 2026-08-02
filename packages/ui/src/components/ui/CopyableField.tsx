import { type Component, Show } from "solid-js";
import { CopyIcon } from "@/icons/svg/index.ts";

interface CopyableFieldProps {
  label: string;
  value?: string;
  masked?: boolean;
  onCopy: (text: string, label: string) => void;
  copyTitle?: string;
  fallbackText?: string;
}

export const CopyableField: Component<CopyableFieldProps> = (props) => {
  return (
    <div class="detail-row">
      <div class="field-content">
        <div class="field-label">{props.label}</div>
        <div class={`field-value text-break ${props.masked ? "password-font" : ""}`}>
          <Show when={Boolean(props.value)} fallback={props.fallbackText || ""}>
            {props.value}
          </Show>
        </div>
      </div>
      <Show when={Boolean(props.value)}>
        <button
          type="button"
          class="action-btn"
          onClick={() => props.onCopy(props.value || "", props.label)}
          title={props.copyTitle || props.label}
        >
          <CopyIcon />
        </button>
      </Show>
    </div>
  );
};

export default CopyableField;
