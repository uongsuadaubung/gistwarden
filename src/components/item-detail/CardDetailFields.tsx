import { type Component, createSignal, Show } from "solid-js";
import { type CardVaultItem } from "@/shared/types.ts";
import { t } from "@/shared/i18n.ts";
import { CopyIcon, EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";
import CardBrandIcon from "@/components/CardBrandIcon.tsx";

interface CardDetailFieldsProps {
  item: CardVaultItem;
  onCopy: (text: string, label: string) => void;
}

export const CardDetailFields: Component<CardDetailFieldsProps> = (props) => {
  const [showCardNumber, setShowCardNumber] = createSignal(false);
  const [showCardCode, setShowCardCode] = createSignal(false);

  const isExpired = () => {
    const year = parseInt(props.item.card.expYear || "");
    const month = parseInt(props.item.card.expMonth || "");
    if (isNaN(year) || isNaN(month)) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear) return true;
    if (year === currentYear && month < currentMonth) return true;
    return false;
  };

  return (
    <>
      {/* Expired card warning */}
      <Show when={isExpired()}>
        <div class="alert alert-info d-flex gap-8 align-center mb-16">
          <svg
            class="icon-inline-large"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <div class="font-w-600">{t("detail_card_expired_title")}</div>
            <div class="font-sz-12 text-muted mt-2">
              {t("detail_card_expired_desc")}
            </div>
          </div>
        </div>
      </Show>

      {/* Card Info Box */}
      <div class="card p-16 mb-16">
        <div class="d-flex align-center gap-12">
          <div class="item-icon-container item-icon-container-large">
            <CardBrandIcon brand={props.item.card.brand || ""} />
          </div>
          <div>
            <div class="font-w-600 font-sz-16 text-break">
              {props.item.name}
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section-title">
        {t("detail_card_details_title", {
          brand: props.item.card.brand || "Card",
        })}
      </div>
      <div class="card mb-16">
        {/* Cardholder Name */}
        <div class="detail-row">
          <div class="field-content">
            <div class="field-label">{t("detail_card_cardholder")}</div>
            <div class="field-value text-break">
              {props.item.card.cardholderName || t("detail_no_value")}
            </div>
          </div>
          <Show when={props.item.card.cardholderName}>
            <button
              type="button"
              class="action-btn"
              onClick={() =>
                props.onCopy(
                  props.item.card.cardholderName || "",
                  t("detail_card_cardholder"),
                )}
              title={t("btn_copy")}
            >
              <CopyIcon />
            </button>
          </Show>
        </div>

        {/* Card Number */}
        <div class="detail-row">
          <div class="field-content">
            <div class="field-label">{t("detail_card_number")}</div>
            <div class="field-value password-font text-break">
              {showCardNumber()
                ? (props.item.card.number || "")
                : (props.item.card.number || "").replace(/./g, "•")}
            </div>
          </div>
          <div class="field-actions">
            <button
              type="button"
              class="action-btn"
              onClick={() => setShowCardNumber(!showCardNumber())}
              title={t("detail_card_number")}
            >
              <Show
                when={showCardNumber()}
                fallback={<EyeIcon class="icon-inline" />}
              >
                <EyeOffIcon class="icon-inline" />
              </Show>
            </button>
            <Show when={props.item.card.number}>
              <button
                type="button"
                class="action-btn"
                onClick={() =>
                  props.onCopy(
                    props.item.card.number || "",
                    t("detail_card_number"),
                  )}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </Show>
          </div>
        </div>

        {/* Expiration */}
        <div class="detail-row">
          <div class="field-content">
            <div class="field-label">{t("detail_card_expiration")}</div>
            <div class="field-value text-break">
              {props.item.card.expMonth && props.item.card.expYear
                ? `${
                  props.item.card.expMonth.padStart(2, "0")
                } / ${props.item.card.expYear}`
                : t("detail_no_value")}
            </div>
          </div>
        </div>

        {/* Security Code */}
        <div class="detail-row">
          <div class="field-content">
            <div class="field-label">{t("detail_card_security_code")}</div>
            <div class="field-value password-font text-break">
              {showCardCode()
                ? (props.item.card.code || "")
                : (props.item.card.code || "").replace(/./g, "•")}
            </div>
          </div>
          <div class="field-actions">
            <button
              type="button"
              class="action-btn"
              onClick={() => setShowCardCode(!showCardCode())}
              title={t("detail_card_security_code")}
            >
              <Show
                when={showCardCode()}
                fallback={<EyeIcon class="icon-inline" />}
              >
                <EyeOffIcon class="icon-inline" />
              </Show>
            </button>
            <Show when={props.item.card.code}>
              <button
                type="button"
                class="action-btn"
                onClick={() =>
                  props.onCopy(
                    props.item.card.code || "",
                    t("detail_card_security_code"),
                  )}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
};

export default CardDetailFields;
