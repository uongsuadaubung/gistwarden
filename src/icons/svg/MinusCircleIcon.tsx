import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const MinusCircleIcon: Component<IconProps> = (props) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="transparent" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
};
export default MinusCircleIcon;
