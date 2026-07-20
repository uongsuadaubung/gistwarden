import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

const EnIcon: Component<IconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <path d="M 3 6 L 3 18 M 3 6 L 9 6 M 3 12 L 8 12 M 3 18 L 9 18" fill="transparent" />
      <path d="M 13 18 L 13 6 L 21 18 L 21 6" fill="transparent" />
    </svg>
  );
};

export default EnIcon;
