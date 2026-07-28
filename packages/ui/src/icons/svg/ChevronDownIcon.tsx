import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const ChevronDownIcon: Component<IconProps> = (props) => {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
};
export default ChevronDownIcon;
