import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const SshKeyIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H7v-2h8v2zm-6.5-5L6 10.5 7.41 9.09 11.32 13l-3.91 3.91L6 15.5l2.5-2.5z"
        fill="currentColor"
      />
    </svg>
  );
};
export default SshKeyIcon;
