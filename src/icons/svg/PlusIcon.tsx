import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

export const PlusIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
};
export default PlusIcon;
