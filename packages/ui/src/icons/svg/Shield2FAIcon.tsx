import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const Shield2FAIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-6.5-6V9.5C10.5 8.67 11.17 8 12 8s1.5.67 1.5 1.5V11c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5v-3c0-.83.67-1.5 1.5-1.5zm1-3.5c0-.28.22-.5.5-.5s.5.22.5.5V11h-1V9.5z"
        fill="currentColor"
      />
    </svg>
  );
};
export default Shield2FAIcon;
