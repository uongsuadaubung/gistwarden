import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

const ViIcon: Component<IconProps> = (props) => {
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
      <path d="M 4 6 L 10 18 L 16 6" fill="transparent" />
      <path d="M 20 6 L 20 18" fill="transparent" />
    </svg>
  );
};

export default ViIcon;
