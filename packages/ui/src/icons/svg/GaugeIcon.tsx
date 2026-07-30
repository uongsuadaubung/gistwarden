import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const GaugeIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M12 3C6.48 3 2 7.48 2 13c0 3.32 1.62 6.26 4.13 8.09l1.42-1.42C5.61 18.27 4 15.82 4 13c0-4.41 3.59-8 8-8s8 3.59 8 8c0 2.82-1.61 5.27-3.55 6.67l1.42 1.42C20.38 19.26 22 16.32 22 13c0-5.52-4.48-10-10-10zm-1 5v5.09l-3.29 3.29 1.41 1.41L12.83 14c.48-.28.84-.73.97-1.28.13-.55-.02-1.12-.4-1.52L11 8z"
        fill="currentColor"
      />
    </svg>
  );
};
export default GaugeIcon;
