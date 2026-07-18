import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/shared/i18n.ts";
import Input from "@/components/Input.tsx";
import { EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";
import FormField from "@/components/FormField.tsx";

interface IdentityEditFieldsProps {
  identityTitle: string;
  setIdentityTitle: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  middleName: string;
  setMiddleName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  identityUsername: string;
  setIdentityUsername: (val: string) => void;
  company: string;
  setCompany: (val: string) => void;
  ssn: string;
  setSsn: (val: string) => void;
  passportNumber: string;
  setPassportNumber: (val: string) => void;
  licenseNumber: string;
  setLicenseNumber: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  address1: string;
  setAddress1: (val: string) => void;
  address2: string;
  setAddress2: (val: string) => void;
  address3: string;
  setAddress3: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  state: string;
  setState: (val: string) => void;
  postalCode: string;
  setPostalCode: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
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
              value={props.identityTitle}
              onInput={(e) => props.setIdentityTitle(e.currentTarget.value)}
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
              value={props.firstName}
              onInput={(e) => props.setFirstName(e.currentTarget.value)}
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
              value={props.middleName}
              onInput={(e) => props.setMiddleName(e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-last-name"
            label={t("detail_identity_last_name")}
            class="mb-0"
          >
            <Input
              id="id-last-name"
              value={props.lastName}
              onInput={(e) => props.setLastName(e.currentTarget.value)}
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
              value={props.identityUsername}
              onInput={(e) => props.setIdentityUsername(e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-company"
            label={t("detail_identity_company")}
            class="mb-0"
          >
            <Input
              id="id-company"
              value={props.company}
              onInput={(e) => props.setCompany(e.currentTarget.value)}
            />
          </FormField>
        </div>
      </div>

      {/* 2. Identification */}
      <div class="detail-section-title">
        {t("detail_identity_identification_section")}
      </div>
      <div class="card p-16 mb-16 d-flex flex-column gap-12">
        <FormField
          id="id-ssn"
          label={t("detail_identity_ssn")}
          class="mb-0 pos-relative"
        >
          <div class="pos-relative d-flex align-center">
            <Input
              id="id-ssn"
              type={showSsn() ? "text" : "password"}
              value={props.ssn}
              onInput={(e) => props.setSsn(e.currentTarget.value)}
              class="w-100"
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
          </div>
        </FormField>

        <FormField
          id="id-passport"
          label={t("detail_identity_passport")}
          class="mb-0 pos-relative"
        >
          <div class="pos-relative d-flex align-center">
            <Input
              id="id-passport"
              type={showPassport() ? "text" : "password"}
              value={props.passportNumber}
              onInput={(e) => props.setPassportNumber(e.currentTarget.value)}
              class="w-100"
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
          </div>
        </FormField>

        <FormField
          id="id-license"
          label={t("detail_identity_license")}
          class="mb-0"
        >
          <Input
            id="id-license"
            value={props.licenseNumber}
            onInput={(e) => props.setLicenseNumber(e.currentTarget.value)}
          />
        </FormField>
      </div>

      {/* 3. Contact Info */}
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
              value={props.email}
              onInput={(e) => props.setEmail(e.currentTarget.value)}
              placeholder="name@example.com"
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
              value={props.phone}
              onInput={(e) => props.setPhone(e.currentTarget.value)}
            />
          </FormField>
        </div>
      </div>

      {/* 4. Address */}
      <div class="detail-section-title">
        {t("detail_identity_address")}
      </div>
      <div class="card p-16 mb-12 d-flex flex-column gap-12">
        <FormField
          id="id-address1"
          label={`${t("detail_identity_address")} 1`}
          class="mb-0"
        >
          <Input
            id="id-address1"
            value={props.address1}
            onInput={(e) => props.setAddress1(e.currentTarget.value)}
          />
        </FormField>

        <FormField
          id="id-address2"
          label={`${t("detail_identity_address")} 2`}
          class="mb-0"
        >
          <Input
            id="id-address2"
            value={props.address2}
            onInput={(e) => props.setAddress2(e.currentTarget.value)}
          />
        </FormField>

        <FormField
          id="id-address3"
          label={`${t("detail_identity_address")} 3`}
          class="mb-0"
        >
          <Input
            id="id-address3"
            value={props.address3}
            onInput={(e) => props.setAddress3(e.currentTarget.value)}
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
              value={props.city}
              onInput={(e) => props.setCity(e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-state"
            label={t("detail_identity_state")}
            class="mb-0"
          >
            <Input
              id="id-state"
              value={props.state}
              onInput={(e) => props.setState(e.currentTarget.value)}
            />
          </FormField>
        </div>

        <div class="grid-2">
          <FormField
            id="id-postal-code"
            label={t("detail_identity_postal_code")}
            class="mb-0"
          >
            <Input
              id="id-postal-code"
              value={props.postalCode}
              onInput={(e) => props.setPostalCode(e.currentTarget.value)}
            />
          </FormField>
          <FormField
            id="id-country"
            label={t("detail_identity_country")}
            class="mb-0"
          >
            <Input
              id="id-country"
              value={props.country}
              onInput={(e) => props.setCountry(e.currentTarget.value)}
            />
          </FormField>
        </div>
      </div>
    </>
  );
};

export default IdentityEditFields;
