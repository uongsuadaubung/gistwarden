import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

export const ChevronDownIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
};
export default ChevronDownIcon;
