import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const TrashIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
};
export default TrashIcon;
