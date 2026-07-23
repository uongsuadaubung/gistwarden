import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const ListCheckIcon: Component<IconProps> = (props) => {
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
      <path d="M11 6h10" />
      <path d="M11 12h10" />
      <path d="M11 18h10" />
      <path d="m3 6 2 2 4-4" />
      <path d="m3 12 2 2 4-4" />
      <path d="m3 18 2 2 4-4" />
    </svg>
  );
};
export default ListCheckIcon;
