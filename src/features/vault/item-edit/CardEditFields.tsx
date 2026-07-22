import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import Select from "@/components/ui/Select.tsx";
import FormField from "@/components/ui/FormField.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";

const BRAND_OPTIONS = [
  { value: "", label: "-- Select --" },
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "American Express", label: "American Express" },
  { value: "Discover", label: "Discover" },
  { value: "Diners Club", label: "Diners Club" },
  { value: "JCB", label: "JCB" },
  { value: "Maestro", label: "Maestro" },
  { value: "UnionPay", label: "UnionPay" },
  { value: "RuPay", label: "RuPay" },
  { value: "Other", label: "Other" },
];

const EXP_MONTH_OPTIONS = [
  { value: "1", label: "01 - January" },
  { value: "2", label: "02 - February" },
  { value: "3", label: "03 - March" },
  { value: "4", label: "04 - April" },
  { value: "5", label: "05 - May" },
  { value: "6", label: "06 - June" },
  { value: "7", label: "07 - July" },
  { value: "8", label: "08 - August" },
  { value: "9", label: "09 - September" },
  { value: "10", label: "10 - October" },
  { value: "11", label: "11 - November" },
  { value: "12", label: "12 - December" },
];

interface CardEditFieldsProps {
  formState: ItemEditFormState;
  updateForm: <K extends keyof ItemEditFormState>(
    key: K,
    val: ItemEditFormState[K],
  ) => void;
}

export const CardEditFields: Component<CardEditFieldsProps> = (props) => {
  return (
    <>
      <div class="detail-section-title">
        {t("detail_card_details_title", {
          brand: props.formState.cardBrand || "Card",
        })}
      </div>
      <div class="card mb-16 overflow-visible">
        {/* Cardholder name */}
        <FormField id="card-holder" label={t("detail_card_cardholder")}>
          <Input
            id="card-holder"
            type="text"
            value={props.formState.cardholderName}
            onInput={(e) =>
              props.updateForm("cardholderName", e.currentTarget.value)}
            placeholder="e.g. John Doe"
          />
        </FormField>

        {/* Number */}
        <FormField id="card-number" label={t("detail_card_number")}>
          <div class="pos-relative">
            <Input
              id="card-number"
              type="password"
              class="password-font"
              value={props.formState.cardNumber}
              onInput={(e) =>
                props.updateForm("cardNumber", e.currentTarget.value)}
              placeholder="•••• •••• •••• ••••"
            />
          </div>
        </FormField>

        {/* Brand dropdown */}
        <FormField id="card-brand" label={t("detail_card_brand")}>
          <Select
            id="card-brand"
            value={props.formState.cardBrand}
            onChange={(e) =>
              props.updateForm("cardBrand", e.currentTarget.value)}
            options={BRAND_OPTIONS}
          />
        </FormField>

        {/* Expiration date */}
        <div class="grid-2">
          <FormField
            id="card-exp-month"
            label={t("detail_card_expiration")}
          >
            <Select
              id="card-exp-month"
              value={props.formState.cardExpMonth}
              onChange={(e) =>
                props.updateForm("cardExpMonth", e.currentTarget.value)}
              options={EXP_MONTH_OPTIONS}
            />
          </FormField>
          <FormField id="card-exp-year" label="Year">
            <Input
              id="card-exp-year"
              type="number"
              value={props.formState.cardExpYear}
              onInput={(e) =>
                props.updateForm("cardExpYear", e.currentTarget.value)}
              placeholder="2026"
            />
          </FormField>
        </div>

        {/* Security code */}
        <FormField id="card-code" label={t("detail_card_security_code")}>
          <div class="pos-relative">
            <Input
              id="card-code"
              type="password"
              class="password-font"
              value={props.formState.cardCode}
              onInput={(e) =>
                props.updateForm("cardCode", e.currentTarget.value)}
              placeholder="123"
            />
          </div>
        </FormField>
      </div>
    </>
  );
};

export default CardEditFields;
