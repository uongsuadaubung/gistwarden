import { type Component, type JSX, Show } from "solid-js";
import { ArrowLeftIcon, PopoutIcon } from "@/icons/svg/index.ts";
import { handlePopout, isPopout } from "@/core/popout-utils.ts";
import { t } from "@/core/i18n.ts";

interface DetailHeaderProps {
  title: string;
  onBack: () => void;
  showPopout?: boolean;
  rightActions?: JSX.Element;
}

export const DetailHeader: Component<DetailHeaderProps> = (props) => {
  return (
    <div class="detail-header">
      <div class="back-btn" onClick={props.onBack}>
        <ArrowLeftIcon />
      </div>
      <div class="detail-title">{props.title}</div>
      <div class="d-flex align-items-center gap-8 ml-auto">
        {props.rightActions}
        <Show when={props.showPopout && !isPopout()}>
          <button
            type="button"
            class="action-btn"
            onClick={handlePopout}
            title={t("vault_popout_title")}
          >
            <PopoutIcon />
          </button>
        </Show>
      </div>
    </div>
  );
};

export default DetailHeader;
