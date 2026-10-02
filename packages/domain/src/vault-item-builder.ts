import {
  asFolderId,
  asVaultItemId,
  type CardDetails,
  type CardVaultItem,
  CardVaultItemSchema,
  type FolderId,
  type IdentityDetails,
  type IdentityVaultItem,
  IdentityVaultItemSchema,
  type LoginUri,
  type LoginVaultItem,
  LoginVaultItemSchema,
  type SecureNoteVaultItem,
  SecureNoteVaultItemSchema,
  type SshKeyDetails,
  type SshKeyVaultItem,
  SshKeyVaultItemSchema,
  UriMatchMode,
  type VaultField,
  type VaultItem,
  type VaultItemId,
} from "./vault-schemas.ts";
import { VaultItemType } from "./vault-types.ts";

export abstract class BaseVaultItemBuilder<
  _TBuilder extends BaseVaultItemBuilder<_TBuilder, TItem>,
  TItem extends VaultItem,
> {
  protected raw: any;

  constructor(type: VaultItemType, initial?: Record<string, any>) {
    const now = new Date().toISOString();
    this.raw = {
      id: asVaultItemId(crypto.randomUUID()),
      folderId: null,
      type,
      name: "",
      notes: "",
      favorite: false,
      reprompt: 0,
      fields: [],
      creationDate: now,
      revisionDate: now,
      ...initial,
    };
  }

  setId(id: VaultItemId | string): this {
    this.raw.id = asVaultItemId(id);
    return this;
  }

  setFolderId(folderId: FolderId | string | null | undefined): this {
    this.raw.folderId =
      folderId != null && folderId !== "" ? asFolderId(folderId) : null;
    return this;
  }

  setName(name: string): this {
    this.raw.name = name.trim();
    return this;
  }

  setNotes(notes: string): this {
    this.raw.notes = notes;
    return this;
  }

  setFavorite(favorite: boolean = true): this {
    this.raw.favorite = favorite;
    return this;
  }

  setReprompt(reprompt: number): this {
    this.raw.reprompt = reprompt;
    return this;
  }

  setCreationDate(date: string): this {
    this.raw.creationDate = date;
    return this;
  }

  setRevisionDate(date: string): this {
    this.raw.revisionDate = date;
    return this;
  }

  addField(field: VaultField): this {
    this.raw.fields.push(field);
    return this;
  }

  setFields(fields: readonly VaultField[]): this {
    this.raw.fields = [...fields];
    return this;
  }

  abstract build(): TItem;
}

export class LoginItemBuilder extends BaseVaultItemBuilder<
  LoginItemBuilder,
  LoginVaultItem
> {
  constructor(initial?: Partial<LoginVaultItem>) {
    super(VaultItemType.Login, {
      ...initial,
      login: {
        username: "",
        password: "",
        totp: "",
        uris: [],
        passwordRevisionDate: null,
        ...initial?.login,
      },
    });
  }

  setUsername(username: string): this {
    this.raw.login.username = username;
    return this;
  }

  setPassword(password: string): this {
    this.raw.login.password = password;
    return this;
  }

  setCredentials(username: string, password?: string): this {
    this.raw.login.username = username;
    if (password !== undefined) this.raw.login.password = password;
    return this;
  }

  setTotp(totp: string): this {
    this.raw.login.totp = totp;
    return this;
  }

  addUri(uri: string, match?: UriMatchMode | null): this {
    if (uri.trim()) {
      this.raw.login.uris.push({
        uri: uri.trim(),
        match: match ?? UriMatchMode.Domain,
      });
    }
    return this;
  }

  setUris(uris: readonly LoginUri[]): this {
    this.raw.login.uris = [...uris];
    return this;
  }

  setPasswordRevisionDate(date: string | null): this {
    this.raw.login.passwordRevisionDate = date;
    return this;
  }

  build(): LoginVaultItem {
    if (!this.raw.name) {
      this.raw.name = this.raw.login.username || "New Login";
    }
    return LoginVaultItemSchema.parse(this.raw);
  }
}

export class CardItemBuilder extends BaseVaultItemBuilder<
  CardItemBuilder,
  CardVaultItem
> {
  constructor(initial?: Partial<CardVaultItem>) {
    super(VaultItemType.Card, {
      ...initial,
      card: {
        cardholderName: "",
        brand: "",
        number: "",
        expMonth: "",
        expYear: "",
        code: "",
        ...initial?.card,
      },
    });
  }

  setCardDetails(card: Partial<CardDetails>): this {
    this.raw.card = { ...this.raw.card, ...card };
    return this;
  }

  build(): CardVaultItem {
    if (!this.raw.name) {
      this.raw.name = this.raw.card.cardholderName || "New Card";
    }
    return CardVaultItemSchema.parse(this.raw);
  }
}

export class IdentityItemBuilder extends BaseVaultItemBuilder<
  IdentityItemBuilder,
  IdentityVaultItem
> {
  constructor(initial?: Partial<IdentityVaultItem>) {
    super(VaultItemType.Identity, {
      ...initial,
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
        ...initial?.identity,
      },
    });
  }

  setIdentityDetails(details: Partial<IdentityDetails>): this {
    this.raw.identity = { ...this.raw.identity, ...details };
    return this;
  }

  build(): IdentityVaultItem {
    if (!this.raw.name) {
      const fullName = [this.raw.identity.firstName, this.raw.identity.lastName]
        .filter(Boolean)
        .join(" ");
      this.raw.name = fullName || this.raw.identity.username || "New Identity";
    }
    return IdentityVaultItemSchema.parse(this.raw);
  }
}

export class NoteItemBuilder extends BaseVaultItemBuilder<
  NoteItemBuilder,
  SecureNoteVaultItem
> {
  constructor(initial?: Partial<SecureNoteVaultItem>) {
    super(VaultItemType.SecureNote, initial);
  }

  build(): SecureNoteVaultItem {
    if (!this.raw.name) this.raw.name = "Secure Note";
    return SecureNoteVaultItemSchema.parse(this.raw);
  }
}

export class SshKeyItemBuilder extends BaseVaultItemBuilder<
  SshKeyItemBuilder,
  SshKeyVaultItem
> {
  constructor(initial?: Partial<SshKeyVaultItem>) {
    super(VaultItemType.SshKey, {
      ...initial,
      sshKey: {
        privateKey: "",
        publicKey: "",
        keyFingerprint: "",
        ...initial?.sshKey,
      },
    });
  }

  setSshKeyDetails(details: Partial<SshKeyDetails>): this {
    this.raw.sshKey = { ...this.raw.sshKey, ...details };
    return this;
  }

  build(): SshKeyVaultItem {
    if (!this.raw.name) this.raw.name = "SSH Key";
    return SshKeyVaultItemSchema.parse(this.raw);
  }
}

/**
 * VaultItemBuilder - Centralized Factory and Builder entry point
 */
export class VaultItemBuilder {
  static login(): LoginItemBuilder {
    return new LoginItemBuilder();
  }

  static card(): CardItemBuilder {
    return new CardItemBuilder();
  }

  static identity(): IdentityItemBuilder {
    return new IdentityItemBuilder();
  }

  static note(): NoteItemBuilder {
    return new NoteItemBuilder();
  }

  static sshKey(): SshKeyItemBuilder {
    return new SshKeyItemBuilder();
  }

  static from(existing: LoginVaultItem): LoginItemBuilder;
  static from(existing: CardVaultItem): CardItemBuilder;
  static from(existing: IdentityVaultItem): IdentityItemBuilder;
  static from(existing: SecureNoteVaultItem): NoteItemBuilder;
  static from(existing: SshKeyVaultItem): SshKeyItemBuilder;
  static from(existing: VaultItem): BaseVaultItemBuilder<any, VaultItem>;
  static from(existing: VaultItem): BaseVaultItemBuilder<any, VaultItem> {
    const clone = JSON.parse(JSON.stringify(existing));
    switch (existing.type) {
      case VaultItemType.Login:
        return new LoginItemBuilder(clone);
      case VaultItemType.Card:
        return new CardItemBuilder(clone);
      case VaultItemType.Identity:
        return new IdentityItemBuilder(clone);
      case VaultItemType.SecureNote:
        return new NoteItemBuilder(clone);
      case VaultItemType.SshKey:
        return new SshKeyItemBuilder(clone);
    }
  }
}
