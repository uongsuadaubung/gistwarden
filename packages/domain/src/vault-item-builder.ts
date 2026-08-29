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
  VaultItemSchema,
} from "./vault-schemas.ts";
import { VaultItemType } from "./vault-types.ts";

export abstract class BaseVaultItemBuilder<
  TBuilder extends BaseVaultItemBuilder<TBuilder, TItem>,
  TItem extends VaultItem,
> {
  protected id?: VaultItemId;
  protected folderId?: FolderId | null = null;
  protected name = "";
  protected notes = "";
  protected favorite = false;
  protected reprompt = 0;
  protected fields: VaultField[] = [];
  protected creationDate?: string;
  protected revisionDate?: string;

  setId(id: VaultItemId | string): this {
    this.id = asVaultItemId(id);
    return this;
  }

  setFolderId(folderId: FolderId | string | null | undefined): this {
    this.folderId =
      folderId != null && folderId !== "" ? asFolderId(folderId) : null;
    return this;
  }

  setName(name: string): this {
    this.name = name.trim();
    return this;
  }

  setNotes(notes: string): this {
    this.notes = notes;
    return this;
  }

  setFavorite(favorite: boolean = true): this {
    this.favorite = favorite;
    return this;
  }

  setReprompt(reprompt: number): this {
    this.reprompt = reprompt;
    return this;
  }

  setCreationDate(date: string): this {
    this.creationDate = date;
    return this;
  }

  setRevisionDate(date: string): this {
    this.revisionDate = date;
    return this;
  }

  addField(field: VaultField): this {
    this.fields.push(field);
    return this;
  }

  setFields(fields: readonly VaultField[]): this {
    this.fields = [...fields];
    return this;
  }

  protected getBaseAttributes(): {
    id: VaultItemId;
    folderId: FolderId | null;
    name: string;
    notes: string;
    favorite: boolean;
    reprompt: number;
    fields: VaultField[];
    creationDate: string;
    revisionDate: string;
  } {
    const now = new Date().toISOString();
    return {
      id: this.id || asVaultItemId(crypto.randomUUID()),
      folderId: this.folderId ?? null,
      name: this.name,
      notes: this.notes,
      favorite: this.favorite,
      reprompt: this.reprompt,
      fields: this.fields,
      creationDate: this.creationDate || now,
      revisionDate: this.revisionDate || now,
    };
  }

  abstract build(): TItem;
}

export class LoginItemBuilder extends BaseVaultItemBuilder<
  LoginItemBuilder,
  LoginVaultItem
> {
  private username = "";
  private password = "";
  private totp = "";
  private uris: LoginUri[] = [];
  private passwordRevisionDate: string | null = null;

  setUsername(username: string): this {
    this.username = username;
    return this;
  }

  setPassword(password: string): this {
    this.password = password;
    return this;
  }

  setCredentials(username: string, password?: string): this {
    this.username = username;
    if (password !== undefined) {
      this.password = password;
    }
    return this;
  }

  setTotp(totp: string): this {
    this.totp = totp;
    return this;
  }

  addUri(uri: string, match?: UriMatchMode | null): this {
    if (uri.trim()) {
      this.uris.push({ uri: uri.trim(), match: match ?? UriMatchMode.Domain });
    }
    return this;
  }

  setUris(uris: readonly LoginUri[]): this {
    this.uris = [...uris];
    return this;
  }

  setPasswordRevisionDate(date: string | null): this {
    this.passwordRevisionDate = date;
    return this;
  }

  build(): LoginVaultItem {
    const base = this.getBaseAttributes();
    const raw: LoginVaultItem = {
      ...base,
      type: VaultItemType.Login,
      name: base.name || this.username || "New Login",
      login: {
        username: this.username,
        password: this.password,
        totp: this.totp,
        uris: this.uris,
        passwordRevisionDate: this.passwordRevisionDate,
      },
    };
    return LoginVaultItemSchema.parse(raw);
  }
}

export class CardItemBuilder extends BaseVaultItemBuilder<
  CardItemBuilder,
  CardVaultItem
> {
  private card: CardDetails = {
    cardholderName: "",
    brand: "",
    number: "",
    expMonth: "",
    expYear: "",
    code: "",
  };

  setCardDetails(details: Partial<CardDetails>): this {
    this.card = {
      cardholderName: details.cardholderName ?? this.card.cardholderName,
      brand: details.brand ?? this.card.brand,
      number: details.number ?? this.card.number,
      expMonth: details.expMonth ?? this.card.expMonth,
      expYear: details.expYear ?? this.card.expYear,
      code: details.code ?? this.card.code,
    };
    return this;
  }

  build(): CardVaultItem {
    const base = this.getBaseAttributes();
    const raw: CardVaultItem = {
      ...base,
      type: VaultItemType.Card,
      name: base.name || this.card.cardholderName || "New Card",
      card: this.card,
    };
    return CardVaultItemSchema.parse(raw);
  }
}

export class IdentityItemBuilder extends BaseVaultItemBuilder<
  IdentityItemBuilder,
  IdentityVaultItem
> {
  private identity: IdentityDetails = {
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
  };

  setIdentityDetails(details: Partial<IdentityDetails>): this {
    this.identity = {
      ...this.identity,
      ...details,
    };
    return this;
  }

  build(): IdentityVaultItem {
    const base = this.getBaseAttributes();
    const fullName = [this.identity.firstName, this.identity.lastName]
      .filter(Boolean)
      .join(" ");
    const raw: IdentityVaultItem = {
      ...base,
      type: VaultItemType.Identity,
      name: base.name || fullName || this.identity.username || "New Identity",
      identity: this.identity,
    };
    return IdentityVaultItemSchema.parse(raw);
  }
}

export class NoteItemBuilder extends BaseVaultItemBuilder<
  NoteItemBuilder,
  SecureNoteVaultItem
> {
  build(): SecureNoteVaultItem {
    const base = this.getBaseAttributes();
    const raw: SecureNoteVaultItem = {
      ...base,
      type: VaultItemType.SecureNote,
      name: base.name || "Secure Note",
    };
    return SecureNoteVaultItemSchema.parse(raw);
  }
}

export class SshKeyItemBuilder extends BaseVaultItemBuilder<
  SshKeyItemBuilder,
  SshKeyVaultItem
> {
  private sshKey: SshKeyDetails = {
    privateKey: "",
    publicKey: "",
    keyFingerprint: "",
  };

  setSshKeyDetails(details: Partial<SshKeyDetails>): this {
    this.sshKey = {
      privateKey: details.privateKey ?? this.sshKey.privateKey,
      publicKey: details.publicKey ?? this.sshKey.publicKey,
      keyFingerprint: details.keyFingerprint ?? this.sshKey.keyFingerprint,
    };
    return this;
  }

  build(): SshKeyVaultItem {
    const base = this.getBaseAttributes();
    const raw: SshKeyVaultItem = {
      ...base,
      type: VaultItemType.SshKey,
      name: base.name || "SSH Key",
      sshKey: this.sshKey,
    };
    return SshKeyVaultItemSchema.parse(raw);
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
    switch (existing.type) {
      case VaultItemType.Login: {
        const b = new LoginItemBuilder()
          .setId(existing.id)
          .setName(existing.name)
          .setNotes(existing.notes || "")
          .setFolderId(existing.folderId)
          .setFavorite(existing.favorite)
          .setReprompt(existing.reprompt)
          .setFields(existing.fields || [])
          .setCreationDate(existing.creationDate)
          .setRevisionDate(existing.revisionDate)
          .setUsername(existing.login.username || "")
          .setPassword(existing.login.password || "")
          .setTotp(existing.login.totp || "")
          .setUris(existing.login.uris || [])
          .setPasswordRevisionDate(existing.login.passwordRevisionDate ?? null);
        return b;
      }
      case VaultItemType.Card: {
        const b = new CardItemBuilder()
          .setId(existing.id)
          .setName(existing.name)
          .setNotes(existing.notes || "")
          .setFolderId(existing.folderId)
          .setFavorite(existing.favorite)
          .setReprompt(existing.reprompt)
          .setFields(existing.fields || [])
          .setCreationDate(existing.creationDate)
          .setRevisionDate(existing.revisionDate)
          .setCardDetails(existing.card);
        return b;
      }
      case VaultItemType.Identity: {
        const b = new IdentityItemBuilder()
          .setId(existing.id)
          .setName(existing.name)
          .setNotes(existing.notes || "")
          .setFolderId(existing.folderId)
          .setFavorite(existing.favorite)
          .setReprompt(existing.reprompt)
          .setFields(existing.fields || [])
          .setCreationDate(existing.creationDate)
          .setRevisionDate(existing.revisionDate)
          .setIdentityDetails(existing.identity);
        return b;
      }
      case VaultItemType.SecureNote: {
        const b = new NoteItemBuilder()
          .setId(existing.id)
          .setName(existing.name)
          .setNotes(existing.notes || "")
          .setFolderId(existing.folderId)
          .setFavorite(existing.favorite)
          .setReprompt(existing.reprompt)
          .setFields(existing.fields || [])
          .setCreationDate(existing.creationDate)
          .setRevisionDate(existing.revisionDate);
        return b;
      }
      case VaultItemType.SshKey: {
        const b = new SshKeyItemBuilder()
          .setId(existing.id)
          .setName(existing.name)
          .setNotes(existing.notes || "")
          .setFolderId(existing.folderId)
          .setFavorite(existing.favorite)
          .setReprompt(existing.reprompt)
          .setFields(existing.fields || [])
          .setCreationDate(existing.creationDate)
          .setRevisionDate(existing.revisionDate)
          .setSshKeyDetails(existing.sshKey);
        return b;
      }
    }
  }
}
