import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/shared/i18n.ts";
import Input from "@/components/Input.tsx";
import { EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";
import FormField from "@/components/FormField.tsx";

interface CardEditFieldsProps {
  cardholderName: string;
  setCardholderName: (v: string) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardBrand: string;
  setCardBrand: (v: string) => void;
  cardExpMonth: string;
  setCardExpMonth: (v: string) => void;
  cardExpYear: string;
  setCardExpYear: (v: string) => void;
  cardCode: string;
  setCardCode: (v: string) => void;
}

export const CardEditFields: Component<CardEditFieldsProps> = (props) => {
  const [showCardNumber, setShowCardNumber] = createSignal(false);
  const [showCardCode, setShowCardCode] = createSignal(false);

  return (
    <>
      <div class="detail-section-title">
        {t("detail_card_details_title", { brand: props.cardBrand || "Card" })}
      </div>
      <div class="card mb-16">
        {/* Cardholder name */}
        <FormField id="card-holder" label={t("detail_card_cardholder")}>
          <Input
            id="card-holder"
            type="text"
            value={props.cardholderName}
            onInput={(e) => props.setCardholderName(e.currentTarget.value)}
            placeholder="e.g. John Doe"
          />
        </FormField>

        {/* Number */}
        <FormField id="card-number" label={t("detail_card_number")}>
          <div class="pos-relative">
            <Input
              id="card-number"
              type={showCardNumber() ? "text" : "password"}
              class="password-font pr-40"
              value={props.cardNumber}
              onInput={(e) => props.setCardNumber(e.currentTarget.value)}
              placeholder="•••• •••• •••• ••••"
            />
            <div class="input-right-actions">
              <button
                type="button"
                class="action-btn input-action-btn"
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
            </div>
          </div>
        </FormField>

        {/* Brand dropdown */}
        <FormField id="card-brand" label={t("detail_card_brand") || "Brand"}>
          <select
            id="card-brand"
            class="input-control"
            value={props.cardBrand}
            onChange={(e) => props.setCardBrand(e.currentTarget.value)}
          >
            <option value="">-- Select --</option>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="American Express">American Express</option>
            <option value="Discover">Discover</option>
            <option value="Diners Club">Diners Club</option>
            <option value="JCB">JCB</option>
            <option value="Maestro">Maestro</option>
            <option value="UnionPay">UnionPay</option>
            <option value="RuPay">RuPay</option>
            <option value="Other">Other</option>
          </select>
        </FormField>

        {/* Expiration date */}
        <div class="grid-2">
          <FormField id="card-exp-month" label={t("detail_card_expiration") || "Expiration month"}>
            <select
              id="card-exp-month"
              class="input-control"
              value={props.cardExpMonth}
              onChange={(e) => props.setCardExpMonth(e.currentTarget.value)}
            >
              <option value="1">01 - January</option>
              <option value="2">02 - February</option>
              <option value="3">03 - March</option>
              <option value="4">04 - April</option>
              <option value="5">05 - May</option>
              <option value="6">06 - June</option>
              <option value="7">07 - July</option>
              <option value="8">08 - August</option>
              <option value="9">09 - September</option>
              <option value="10">10 - October</option>
              <option value="11">11 - November</option>
              <option value="12">12 - December</option>
            </select>
          </FormField>
          <FormField id="card-exp-year" label="Year">
            <Input
              id="card-exp-year"
              type="number"
              value={props.cardExpYear}
              onInput={(e) => props.setCardExpYear(e.currentTarget.value)}
              placeholder="2026"
            />
          </FormField>
        </div>

        {/* Security code */}
        <FormField id="card-code" label={t("detail_card_security_code")}>
          <div class="pos-relative">
            <Input
              id="card-code"
              type={showCardCode() ? "text" : "password"}
              class="password-font pr-40"
              value={props.cardCode}
              onInput={(e) => props.setCardCode(e.currentTarget.value)}
              placeholder="123"
            />
            <div class="input-right-actions">
              <button
                type="button"
                class="action-btn input-action-btn"
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
            </div>
          </div>
        </FormField>
      </div>
    </>
  );
};

export default CardEditFields;
