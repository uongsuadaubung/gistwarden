import type { Component } from "solid-js";
import type { IconProps } from "./types.ts";

export const CapsLockIcon: Component<IconProps> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class || "icon-inline"}
  >
    <path d="M12 3l-7 7h4v6h6v-6h4z" />
    <path d="M5 20h14" />
  </svg>
);

export default CapsLockIcon;
