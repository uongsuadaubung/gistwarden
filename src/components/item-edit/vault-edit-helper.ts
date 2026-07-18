import { z } from "zod";
import {
  type CardVaultItem,
  Fido2CredentialSchema,
  type IdentityVaultItem,
  LoginUriSchema,
  type LoginVaultItem,
  type SecureNoteVaultItem,
  type SshKeyVaultItem,
  VaultFieldSchema,
  type VaultItem,
  VaultItemType,
} from "@/shared/types.ts";

export const ItemEditFormSchema = z.object({
  itemType: z.enum(VaultItemType),
  name: z.string(),
  notes: z.string(),
  favorite: z.boolean(),
  reprompt: z.number(),
  fields: z.array(VaultFieldSchema),
  username: z.string(),
  password: z.string(),
  uris: z.array(LoginUriSchema),
  totpSecret: z.string(),
  fidoCredentials: z.array(Fido2CredentialSchema),
  cardholderName: z.string(),
  cardNumber: z.string(),
  cardBrand: z.string(),
  cardExpMonth: z.string(),
  cardExpYear: z.string(),
  cardCode: z.string(),
  sshPrivateKey: z.string(),
  sshPublicKey: z.string(),
  sshFingerprint: z.string(),
  identityTitle: z.string(),
  firstName: z.string(),
  middleName: z.string(),
  lastName: z.string(),
  identityUsername: z.string(),
  company: z.string(),
  ssn: z.string(),
  passportNumber: z.string(),
  licenseNumber: z.string(),
  email: z.string(),
  phone: z.string(),
  address1: z.string(),
  address2: z.string(),
  address3: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

export type ItemEditFormState = z.infer<typeof ItemEditFormSchema>;

export function getInitialFormState(
  item?: VaultItem | null,
): ItemEditFormState {
  if (item) {
    return {
      itemType: item.type ?? VaultItemType.Login,
      name: item.name ?? "",
      notes: item.notes ?? "",
      favorite: item.favorite ?? false,
      reprompt: item.reprompt ?? 0,
      fields: item.fields ? JSON.parse(JSON.stringify(item.fields)) : [],
      username: item.type === VaultItemType.Login
        ? (item.login.username ?? "")
        : "",
      password: item.type === VaultItemType.Login
        ? (item.login.password ?? "")
        : "",
      uris: item.type === VaultItemType.Login
        ? (item.login.uris && item.login.uris.length > 0
          ? item.login.uris.map((u) => ({ uri: u.uri }))
          : [{ uri: "" }])
        : [],
      totpSecret: item.type === VaultItemType.Login
        ? (item.login.totp ?? "")
        : "",
      fidoCredentials: item.type === VaultItemType.Login
        ? (item.login.fido2Credentials ?? [])
        : [],
      cardholderName: item.type === VaultItemType.Card
        ? (item.card.cardholderName ?? "")
        : "",
      cardNumber: item.type === VaultItemType.Card
        ? (item.card.number ?? "")
        : "",
      cardBrand: item.type === VaultItemType.Card
        ? (item.card.brand ?? "Visa")
        : "Visa",
      cardExpMonth: item.type === VaultItemType.Card
        ? (item.card.expMonth ?? "1")
        : "1",
      cardExpYear: item.type === VaultItemType.Card
        ? (item.card.expYear ?? String(new Date().getFullYear()))
        : String(new Date().getFullYear()),
      cardCode: item.type === VaultItemType.Card ? (item.card.code ?? "") : "",
      sshPrivateKey: item.type === VaultItemType.SshKey
        ? (item.sshKey.privateKey ?? "")
        : "",
      sshPublicKey: item.type === VaultItemType.SshKey
        ? (item.sshKey.publicKey ?? "")
        : "",
      sshFingerprint: item.type === VaultItemType.SshKey
        ? (item.sshKey.keyFingerprint ?? "")
        : "",
      identityTitle: item.type === VaultItemType.Identity
        ? (item.identity.title ?? "")
        : "",
      firstName: item.type === VaultItemType.Identity
        ? (item.identity.firstName ?? "")
        : "",
      middleName: item.type === VaultItemType.Identity
        ? (item.identity.middleName ?? "")
        : "",
      lastName: item.type === VaultItemType.Identity
        ? (item.identity.lastName ?? "")
        : "",
      identityUsername: item.type === VaultItemType.Identity
        ? (item.identity.username ?? "")
        : "",
      company: item.type === VaultItemType.Identity
        ? (item.identity.company ?? "")
        : "",
      ssn: item.type === VaultItemType.Identity
        ? (item.identity.ssn ?? "")
        : "",
      passportNumber: item.type === VaultItemType.Identity
        ? (item.identity.passportNumber ?? "")
        : "",
      licenseNumber: item.type === VaultItemType.Identity
        ? (item.identity.licenseNumber ?? "")
        : "",
      email: item.type === VaultItemType.Identity
        ? (item.identity.email ?? "")
        : "",
      phone: item.type === VaultItemType.Identity
        ? (item.identity.phone ?? "")
        : "",
      address1: item.type === VaultItemType.Identity
        ? (item.identity.address1 ?? "")
        : "",
      address2: item.type === VaultItemType.Identity
        ? (item.identity.address2 ?? "")
        : "",
      address3: item.type === VaultItemType.Identity
        ? (item.identity.address3 ?? "")
        : "",
      city: item.type === VaultItemType.Identity
        ? (item.identity.city ?? "")
        : "",
      state: item.type === VaultItemType.Identity
        ? (item.identity.state ?? "")
        : "",
      postalCode: item.type === VaultItemType.Identity
        ? (item.identity.postalCode ?? "")
        : "",
      country: item.type === VaultItemType.Identity
        ? (item.identity.country ?? "")
        : "",
    };
  }

  return {
    itemType: VaultItemType.Login,
    name: "",
    notes: "",
    favorite: false,
    reprompt: 0,
    fields: [],
    username: "",
    password: "",
    uris: [{ uri: "" }],
    totpSecret: "",
    fidoCredentials: [],
    cardholderName: "",
    cardNumber: "",
    cardBrand: "Visa",
    cardExpMonth: "1",
    cardExpYear: String(new Date().getFullYear()),
    cardCode: "",
    sshPrivateKey: "",
    sshPublicKey: "",
    sshFingerprint: "",
    identityTitle: "",
    firstName: "",
    middleName: "",
    lastName: "",
    identityUsername: "",
    company: "",
    ssn: "",
    passportNumber: "",
    licenseNumber: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  };
}

export function mapFormStateToVaultItem(
  formState: ItemEditFormState,
  selectedItem?: VaultItem | null,
):
  | Partial<LoginVaultItem>
  | Partial<SecureNoteVaultItem>
  | Partial<CardVaultItem>
  | Partial<IdentityVaultItem>
  | Partial<SshKeyVaultItem> {
  // Validate at runtime using Zod
  const validatedForm = ItemEditFormSchema.parse(formState);

  const commonData = {
    id: selectedItem?.id ?? undefined,
    name: validatedForm.name.trim(),
    notes: validatedForm.notes.trim(),
    favorite: validatedForm.favorite,
    reprompt: validatedForm.reprompt,
    fields: validatedForm.fields.map((f) => ({
      type: f.type,
      name: (f.name ?? "").trim(),
      value: (f.value ?? "").trim(),
    })),
  };

  if (validatedForm.itemType === VaultItemType.SecureNote) {
    return {
      ...commonData,
      type: VaultItemType.SecureNote,
    };
  }

  if (validatedForm.itemType === VaultItemType.Card) {
    return {
      ...commonData,
      type: VaultItemType.Card,
      card: {
        cardholderName: validatedForm.cardholderName.trim(),
        brand: validatedForm.cardBrand,
        number: validatedForm.cardNumber.trim(),
        expMonth: validatedForm.cardExpMonth,
        expYear: validatedForm.cardExpYear.trim(),
        code: validatedForm.cardCode.trim(),
      },
    };
  }

  if (validatedForm.itemType === VaultItemType.Login) {
    const originalLogin = selectedItem?.type === VaultItemType.Login
      ? selectedItem.login
      : null;

    let revDate = originalLogin?.passwordRevisionDate ?? null;
    let history = originalLogin?.passwordHistory ?? [];

    const newPassword = validatedForm.password.trim();
    const oldPassword = originalLogin?.password ?? "";

    if (originalLogin && newPassword !== oldPassword) {
      revDate = new Date().toISOString();
      if (oldPassword) {
        history = [
          { lastUsedDate: new Date().toISOString(), password: oldPassword },
          ...(history || []),
        ].slice(0, 5);
      }
    }

    const mappedUris = validatedForm.uris
      .map((u) => ({
        uri: u.uri.trim(),
      }))
      .filter((u) => u.uri);

    return {
      ...commonData,
      type: VaultItemType.Login,
      login: {
        username: validatedForm.username.trim(),
        password: newPassword,
        totp: validatedForm.totpSecret.trim(),
        uris: mappedUris,
        fido2Credentials: validatedForm.fidoCredentials,
        passwordRevisionDate: revDate,
        passwordHistory: history,
      },
    };
  }

  if (validatedForm.itemType === VaultItemType.Identity) {
    return {
      ...commonData,
      type: VaultItemType.Identity,
      identity: {
        title: validatedForm.identityTitle.trim(),
        firstName: validatedForm.firstName.trim(),
        middleName: validatedForm.middleName.trim(),
        lastName: validatedForm.lastName.trim(),
        username: validatedForm.identityUsername.trim(),
        company: validatedForm.company.trim(),
        ssn: validatedForm.ssn.trim(),
        passportNumber: validatedForm.passportNumber.trim(),
        licenseNumber: validatedForm.licenseNumber.trim(),
        email: validatedForm.email.trim(),
        phone: validatedForm.phone.trim(),
        address1: validatedForm.address1.trim(),
        address2: validatedForm.address2.trim(),
        address3: validatedForm.address3.trim(),
        city: validatedForm.city.trim(),
        state: validatedForm.state.trim(),
        postalCode: validatedForm.postalCode.trim(),
        country: validatedForm.country.trim(),
      },
    };
  }

  // SshKey
  return {
    ...commonData,
    type: VaultItemType.SshKey,
    sshKey: {
      privateKey: validatedForm.sshPrivateKey.trim(),
      publicKey: validatedForm.sshPublicKey.trim(),
      keyFingerprint: validatedForm.sshFingerprint.trim(),
    },
  };
}

export function createDefaultVaultItem(type: VaultItemType): VaultItem {
  const common = {
    id: "",
    name: "",
    notes: "",
    favorite: false,
    reprompt: 0,
    fields: [],
    creationDate: "",
    revisionDate: "",
  };

  switch (type) {
    case VaultItemType.SecureNote:
      return {
        ...common,
        type: VaultItemType.SecureNote,
      };
    case VaultItemType.Card:
      return {
        ...common,
        type: VaultItemType.Card,
        card: {
          cardholderName: "",
          brand: "Visa",
          number: "",
          expMonth: "1",
          expYear: String(new Date().getFullYear()),
          code: "",
        },
      };
    case VaultItemType.Identity:
      return {
        ...common,
        type: VaultItemType.Identity,
        identity: {
          title: "",
          firstName: "",
          middleName: "",
          lastName: "",
          username: "",
          company: "",
          ssn: "",
          passportNumber: "",
          licenseNumber: "",
          email: "",
          phone: "",
          address1: "",
          address2: "",
          address3: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
      };
    case VaultItemType.SshKey:
      return {
        ...common,
        type: VaultItemType.SshKey,
        sshKey: {
          privateKey: "",
          publicKey: "",
          keyFingerprint: "",
        },
      };
    case VaultItemType.Login:
    default:
      return {
        ...common,
        type: VaultItemType.Login,
        login: {
          username: "",
          password: "",
          totp: "",
          uris: [],
          fido2Credentials: [],
        },
      };
  }
}
