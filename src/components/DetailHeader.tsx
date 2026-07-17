import { type Component, Show } from "solid-js";
import { ArrowLeftIcon, ExternalLinkIcon } from "@/icons/svg/index.ts";
import { handlePopout, isPopout } from "@/shared/popout-utils.ts";
import { t } from "@/shared/i18n.ts";

interface DetailHeaderProps {
  title: string;
  onBack: () => void;
  showPopout?: boolean;
}

export const DetailHeader: Component<DetailHeaderProps> = (props) => {
  return (
    <div class="detail-header mt-0 mb-16">
      <div class="back-btn" onClick={props.onBack}>
        <ArrowLeftIcon />
      </div>
      <div class="detail-title">{props.title}</div>
      <Show when={props.showPopout && !isPopout()}>
        <button
          type="button"
          class="action-btn ml-auto"
          onClick={handlePopout}
          title={t("vault_popout_title")}
        >
          <ExternalLinkIcon />
        </button>
      </Show>
    </div>
  );
};

export default DetailHeader;
