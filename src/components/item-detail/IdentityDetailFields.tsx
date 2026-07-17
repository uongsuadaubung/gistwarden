import { type Component, createSignal, Show } from "solid-js";
import { type IdentityVaultItem } from "@/shared/types.ts";
import { t } from "@/shared/i18n.ts";
import { CopyIcon, EyeIcon, EyeOffIcon } from "@/icons/svg/index.ts";

interface IdentityDetailFieldsProps {
  item: IdentityVaultItem;
  onCopy: (text: string, label: string) => void;
}

export const IdentityDetailFields: Component<IdentityDetailFieldsProps> = (props) => {
  const [showSsn, setShowSsn] = createSignal(false);
  const [showPassport, setShowPassport] = createSignal(false);

  const getFullName = () => {
    const parts = [
      props.item.identity.title,
      props.item.identity.firstName,
      props.item.identity.middleName,
      props.item.identity.lastName,
    ].map(p => p?.trim()).filter(Boolean);
    return parts.join(" ");
  };

  const getFullAddress = () => {
    const parts = [
      props.item.identity.address1,
      props.item.identity.address2,
      props.item.identity.address3,
      props.item.identity.city,
      props.item.identity.state,
      props.item.identity.postalCode,
      props.item.identity.country,
    ].map(p => p?.trim()).filter(Boolean);
    return parts.join("\n");
  };

  const hasPersonalDetails = () => {
    return !!(getFullName() || props.item.identity.username || props.item.identity.company);
  };

  const hasIdentificationDetails = () => {
    return !!(props.item.identity.ssn || props.item.identity.passportNumber || props.item.identity.licenseNumber);
  };

  const hasContactDetails = () => {
    return !!(props.item.identity.email || props.item.identity.phone || getFullAddress());
  };

  return (
    <>

      {/* 1. Personal Details */}
      <Show when={hasPersonalDetails()}>
        <div class="detail-section-title">
          {t("detail_identity_personal_section")}
        </div>
        <div class="card mb-16">
          {/* Full Name */}
          <Show when={getFullName()}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_first_name")}</div>
                <div class="field-value text-break">{getFullName()}</div>
              </div>
              <button
                type="button"
                class="action-btn"
                onClick={() => props.onCopy(getFullName(), t("detail_identity_first_name"))}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>

          {/* Username */}
          <Show when={props.item.identity.username}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_username")}</div>
                <div class="field-value text-break">{props.item.identity.username}</div>
              </div>
              <button
                type="button"
                class="action-btn"
                onClick={() => props.onCopy(props.item.identity.username || "", t("detail_identity_username"))}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>

          {/* Company */}
          <Show when={props.item.identity.company}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_company")}</div>
                <div class="field-value text-break">{props.item.identity.company}</div>
              </div>
              <button
                type="button"
                class="action-btn"
                onClick={() => props.onCopy(props.item.identity.company || "", t("detail_identity_company"))}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>
        </div>
      </Show>

      {/* 2. Identification Details */}
      <Show when={hasIdentificationDetails()}>
        <div class="detail-section-title">
          {t("detail_identity_identification_section")}
        </div>
        <div class="card mb-16">
          {/* SSN */}
          <Show when={props.item.identity.ssn}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_ssn")}</div>
                <div class="field-value password-font text-break">
                  {showSsn()
                    ? props.item.identity.ssn
                    : (props.item.identity.ssn || "").replace(/./g, "•")}
                </div>
              </div>
              <div class="field-actions">
                <button
                  type="button"
                  class="action-btn"
                  onClick={() => setShowSsn(!showSsn())}
                  title={t("detail_identity_ssn")}
                >
                  <Show when={showSsn()} fallback={<EyeIcon class="icon-inline" />}>
                    <EyeOffIcon class="icon-inline" />
                  </Show>
                </button>
                <button
                  type="button"
                  class="action-btn"
                  onClick={() => props.onCopy(props.item.identity.ssn || "", t("detail_identity_ssn"))}
                  title={t("btn_copy")}
                >
                  <CopyIcon />
                </button>
              </div>
            </div>
          </Show>

          {/* Passport Number */}
          <Show when={props.item.identity.passportNumber}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_passport")}</div>
                <div class="field-value password-font text-break">
                  {showPassport()
                    ? props.item.identity.passportNumber
                    : (props.item.identity.passportNumber || "").replace(/./g, "•")}
                </div>
              </div>
              <div class="field-actions">
                <button
                  type="button"
                  class="action-btn"
                  onClick={() => setShowPassport(!showPassport())}
                  title={t("detail_identity_passport")}
                >
                  <Show when={showPassport()} fallback={<EyeIcon class="icon-inline" />}>
                    <EyeOffIcon class="icon-inline" />
                  </Show>
                </button>
                <button
                  type="button"
                  class="action-btn"
                  onClick={() => props.onCopy(props.item.identity.passportNumber || "", t("detail_identity_passport"))}
                  title={t("btn_copy")}
                >
                  <CopyIcon />
                </button>
              </div>
            </div>
          </Show>

          {/* License Number */}
          <Show when={props.item.identity.licenseNumber}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_license")}</div>
                <div class="field-value text-break">{props.item.identity.licenseNumber}</div>
              </div>
              <button
                type="button"
                class="action-btn"
                onClick={() => props.onCopy(props.item.identity.licenseNumber || "", t("detail_identity_license"))}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>
        </div>
      </Show>

      {/* 3. Contact Details */}
      <Show when={hasContactDetails()}>
        <div class="detail-section-title">
          {t("detail_identity_contact_section")}
        </div>
        <div class="card mb-16">
          {/* Email */}
          <Show when={props.item.identity.email}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_email")}</div>
                <div class="field-value text-break">{props.item.identity.email}</div>
              </div>
              <button
                type="button"
                class="action-btn"
                onClick={() => props.onCopy(props.item.identity.email || "", t("detail_identity_email"))}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>

          {/* Phone */}
          <Show when={props.item.identity.phone}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_phone")}</div>
                <div class="field-value text-break">{props.item.identity.phone}</div>
              </div>
              <button
                type="button"
                class="action-btn"
                onClick={() => props.onCopy(props.item.identity.phone || "", t("detail_identity_phone"))}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>

          {/* Full Address */}
          <Show when={getFullAddress()}>
            <div class="detail-row">
              <div class="field-content">
                <div class="field-label">{t("detail_identity_address")}</div>
                <div class="field-value text-break notes-display mt-4">{getFullAddress()}</div>
              </div>
              <button
                type="button"
                class="action-btn align-self-start mt-8"
                onClick={() => props.onCopy(getFullAddress(), t("detail_identity_address"))}
                title={t("btn_copy")}
              >
                <CopyIcon />
              </button>
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
};

export default IdentityDetailFields;
