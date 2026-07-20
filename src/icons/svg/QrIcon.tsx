import { type Component } from "solid-js";
import { type IconProps } from "@/icons/svg/types.ts";

export const QrIcon: Component<IconProps> = (props) => {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 3h3v3h-3v-3zm3 3h3v2h-3v-2zm-3-3h-2v-2h4v2zm2 2h-2v-2h2v2zm-2 2h-2v-2h2v2zm-2-2h-2v-2h2v2zm2-2v-2h2v2h-2z" />
    </svg>
  );
};
export default QrIcon;
