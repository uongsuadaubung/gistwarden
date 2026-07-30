import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const ShieldAlertIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm1 14h-2v-2h2v2zm0-4h-2V7h2v4z"
        fill="currentColor"
      />
    </svg>
  );
};
export default ShieldAlertIcon;
