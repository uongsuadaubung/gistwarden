import { type Component } from "solid-js";
import { type IconProps } from "./types.ts";

export const KeyIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  );
};
export default KeyIcon;
