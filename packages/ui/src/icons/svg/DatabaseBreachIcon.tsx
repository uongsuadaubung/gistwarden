import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const DatabaseBreachIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M12 3c-4.42 0-8 1.79-8 4v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.32 6 2s-2.13 2-6 2-6-1.32-6-2 2.13-2 6-2zm-6 5.37c1.44.82 3.63 1.33 6 1.33s4.56-.51 6-1.33V11c0 .68-2.13 2-6 2s-6-1.32-6-2V10.37zm12 6.63c-1.44.82-3.63 1.33-6 1.33s-4.56-.51-6-1.33V16c0 .68 2.13 2 6 2s6-1.32 6-2v1z"
        fill="currentColor"
      />
    </svg>
  );
};
export default DatabaseBreachIcon;
