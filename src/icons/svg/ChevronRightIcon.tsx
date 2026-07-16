import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

export const ChevronRightIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      style={props.style}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
};

export default ChevronRightIcon;
