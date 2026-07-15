import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

export const GeneratorIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M7 17H5v-2h2v2zm10-10h-2v2h2V7zm-2 4h-2v2h2v-2zm-4 4H9v2h2v-2zm-2-4H7v2h2v-2zm8 4h-2v2h2v-2zm2-8H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H5V9h14v12z"/>
    </svg>
  );
};
export default GeneratorIcon;
