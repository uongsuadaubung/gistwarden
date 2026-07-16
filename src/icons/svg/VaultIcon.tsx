import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

export const VaultIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 5h14v14H5V5zm7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm5-6h2v2h-2V8zm0 4h2v2h-2v-2z"
      />
    </svg>
  );
};

export default VaultIcon;
