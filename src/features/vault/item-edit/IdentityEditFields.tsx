import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import Input from "@/components/ui/Input.tsx";
import { EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";
import FormField from "@/components/ui/FormField.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";

interface IdentityEditFieldsProps {
  formState: ItemEditFormState;
  updateForm: <K extends keyof ItemEditFormState>(
    key: K,
    val: ItemEditFormState[K],
  ) => void;
}

export const IdentityEditFields: Component<IdentityEditFieldsProps> = (
  props,
) => {
  const [showSsn, setShowSsn] = createSignal(false);
  const [showPassport, setShowPassport] = createSignal(false);

  return (
    <>
      {/* 1. Personal Details */}
      <div class="detail-section-title mt-0">
        {t("detail_identity_personal_section")}
      </div>
      <div class="card p-16 mb-16 d-flex flex-column gap-12">
        <div class="grid-2">
          <FormField
            id="id-title"
            label={t("detail_identity_title")}
            class="mb-0"
          >
            <Input
              id="id-title"
              value={props.formState.identityTitle}
              onInput={(e) =>
                props.updateForm("identityTitle", e.currentTarget.value)}
              placeholder="e.g. Mr., Ms."
            />
          </FormField>
          <FormField
            id="id-first-name"
            label={t("detail_identity_first_name")}
            class="mb-0"
          >
            <Input
              id="id-first-name"
              value={props.formState.firstName}
              onInput={(e) =>
                props.updateForm("firstName", e.currentTarget.value)}
            />
          </FormField>
        </div>

        <div class="grid-2">
          <FormField
            id="id-middle-name"
            label={t("detail_identity_middle_name")}
            class="mb-0"
          >
            <Input
              id="id-middle-name"
              value={props.formState.middleName}
              onInput={(e) =>
                props.updateForm("middleName", e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-last-name"
            label={t("detail_identity_last_name")}
            class="mb-0"
          >
            <Input
              id="id-last-name"
              value={props.formState.lastName}
              onInput={(e) =>
                props.updateForm("lastName", e.currentTarget.value)}
            />
          </FormField>
        </div>

        <div class="grid-2">
          <FormField
            id="id-username"
            label={t("detail_identity_username")}
            class="mb-0"
          >
            <Input
              id="id-username"
              value={props.formState.identityUsername}
              onInput={(e) =>
                props.updateForm("identityUsername", e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-company"
            label={t("detail_identity_company")}
            class="mb-0"
          >
            <Input
              id="id-company"
              value={props.formState.company}
              onInput={(e) =>
                props.updateForm("company", e.currentTarget.value)}
            />
          </FormField>
        </div>

        <div class="grid-2">
          <FormField
            id="id-ssn"
            label={t("detail_identity_ssn")}
            class="mb-0"
          >
            <Input
              id="id-ssn"
              type={showSsn() ? "text" : "password"}
              value={props.formState.ssn}
              onInput={(e) => props.updateForm("ssn", e.currentTarget.value)}
              rightActions={
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  onClick={() => setShowSsn(!showSsn())}
                >
                  <Show
                    fallback={<EyeIcon class="icon-inline" />}
                    when={showSsn()}
                  >
                    <EyeOffIcon class="icon-inline" />
                  </Show>
                </button>
              }
            />
          </FormField>
          <FormField
            id="id-passport"
            label={t("detail_identity_passport")}
            class="mb-0"
          >
            <Input
              id="id-passport"
              type={showPassport() ? "text" : "password"}
              value={props.formState.passportNumber}
              onInput={(e) =>
                props.updateForm("passportNumber", e.currentTarget.value)}
              rightActions={
                <button
                  type="button"
                  class="action-btn input-action-btn"
                  onClick={() => setShowPassport(!showPassport())}
                >
                  <Show
                    fallback={<EyeIcon class="icon-inline" />}
                    when={showPassport()}
                  >
                    <EyeOffIcon class="icon-inline" />
                  </Show>
                </button>
              }
            />
          </FormField>
        </div>

        <FormField id="id-license" label={t("detail_identity_license")}>
          <Input
            id="id-license"
            value={props.formState.licenseNumber}
            onInput={(e) =>
              props.updateForm("licenseNumber", e.currentTarget.value)}
          />
        </FormField>
      </div>

      {/* 2. Contact Details */}
      <div class="detail-section-title">
        {t("detail_identity_contact_section")}
      </div>
      <div class="card p-16 mb-16 d-flex flex-column gap-12">
        <div class="grid-2">
          <FormField
            id="id-email"
            label={t("detail_identity_email")}
            class="mb-0"
          >
            <Input
              id="id-email"
              type="email"
              value={props.formState.email}
              onInput={(e) => props.updateForm("email", e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-phone"
            label={t("detail_identity_phone")}
            class="mb-0"
          >
            <Input
              id="id-phone"
              type="tel"
              value={props.formState.phone}
              onInput={(e) => props.updateForm("phone", e.currentTarget.value)}
            />
          </FormField>
        </div>
      </div>

      {/* 3. Address Details */}
      <div class="detail-section-title">
        {t("detail_identity_address")}
      </div>
      <div class="card p-16 mb-0 d-flex flex-column gap-12">
        <FormField
          id="id-address1"
          label={`${t("detail_identity_address")} 1`}
          class="mb-0"
        >
          <Input
            id="id-address1"
            value={props.formState.address1}
            onInput={(e) => props.updateForm("address1", e.currentTarget.value)}
          />
        </FormField>
        <FormField
          id="id-address2"
          label={`${t("detail_identity_address")} 2`}
          class="mb-0"
        >
          <Input
            id="id-address2"
            value={props.formState.address2}
            onInput={(e) => props.updateForm("address2", e.currentTarget.value)}
          />
        </FormField>
        <FormField
          id="id-address3"
          label={`${t("detail_identity_address")} 3`}
          class="mb-0"
        >
          <Input
            id="id-address3"
            value={props.formState.address3}
            onInput={(e) => props.updateForm("address3", e.currentTarget.value)}
          />
        </FormField>

        <div class="grid-2">
          <FormField
            id="id-city"
            label={t("detail_identity_city")}
            class="mb-0"
          >
            <Input
              id="id-city"
              value={props.formState.city}
              onInput={(e) => props.updateForm("city", e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-state"
            label={t("detail_identity_state")}
            class="mb-0"
          >
            <Input
              id="id-state"
              value={props.formState.state}
              onInput={(e) => props.updateForm("state", e.currentTarget.value)}
            />
          </FormField>
        </div>

        <div class="grid-2">
          <FormField
            id="id-postal"
            label={t("detail_identity_postal_code")}
            class="mb-0"
          >
            <Input
              id="id-postal"
              value={props.formState.postalCode}
              onInput={(e) =>
                props.updateForm("postalCode", e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-country"
            label={t("detail_identity_country")}
            class="mb-0"
          >
            <Input
              id="id-country"
              value={props.formState.country}
              onInput={(e) =>
                props.updateForm("country", e.currentTarget.value)}
            />
          </FormField>
        </div>
      </div>
    </>
  );
};

export default IdentityEditFields;
