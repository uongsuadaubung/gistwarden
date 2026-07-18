import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

export const PopoutIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M19 11h-2v8H5V7h8V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8z M19 3h-2v3h-3v2h3v3h2V8h3V6h-3V3z" />
    </svg>
  );
};
export default PopoutIcon;
