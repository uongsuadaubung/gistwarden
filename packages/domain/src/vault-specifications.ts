import {
  isExactDomainMatch,
  isMatchingDomain,
} from "./vault-domain-matching.ts";
import type {
  FolderId,
  UriMatchMode,
  VaultItem,
  VaultItemId,
} from "./vault-schemas.ts";
import { isLoginItem, type VaultItemType } from "./vault-types.ts";

export interface ISpecification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: ISpecification<T>): ISpecification<T>;
  or(other: ISpecification<T>): ISpecification<T>;
  not(): ISpecification<T>;
}

export abstract class CompositeSpecification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification<T>(this, other);
  }

  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification<T>(this, other);
  }

  not(): ISpecification<T> {
    return new NotSpecification<T>(this);
  }
}

export class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
    );
  }
}

export class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
    );
  }
}

export class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private readonly spec: ISpecification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

export class AllPassSpecification<T> extends CompositeSpecification<T> {
  isSatisfiedBy(_candidate: T): boolean {
    return true;
  }
}

// ----------------------------------------------------
// Concrete Vault Item Specifications
// ----------------------------------------------------

export class TypeMatchSpec extends CompositeSpecification<VaultItem> {
  constructor(private readonly targetType: VaultItemType | "all") {
    super();
  }

  isSatisfiedBy(item: VaultItem): boolean {
    if (this.targetType === "all" || !this.targetType) {
      return true;
    }
    return Number(item.type) === Number(this.targetType);
  }
}

export class DomainMatchSpec extends CompositeSpecification<VaultItem> {
  constructor(
    private readonly domainOrUrl: string,
    private readonly overrideDefaultMode?: UriMatchMode,
  ) {
    super();
  }

  isSatisfiedBy(item: VaultItem): boolean {
    if (!this.domainOrUrl) return false;
    return isMatchingDomain(item, this.domainOrUrl, this.overrideDefaultMode);
  }
}

export class ExactDomainMatchSpec extends CompositeSpecification<VaultItem> {
  constructor(private readonly domain: string) {
    super();
  }

  isSatisfiedBy(item: VaultItem): boolean {
    if (!this.domain) return false;
    return isExactDomainMatch(item, this.domain);
  }
}

export class SearchQuerySpec extends CompositeSpecification<VaultItem> {
  private readonly query: string;

  constructor(searchQuery: string) {
    super();
    this.query = searchQuery.toLowerCase().trim();
  }

  isSatisfiedBy(item: VaultItem): boolean {
    if (!this.query) return true;

    const nameMatch = item.name.toLowerCase().includes(this.query);
    if (nameMatch) return true;

    const notesMatch = (item.notes || "").toLowerCase().includes(this.query);
    if (notesMatch) return true;

    if (isLoginItem(item)) {
      const usernameMatch = Boolean(
        item.login.username?.toLowerCase().includes(this.query),
      );
      if (usernameMatch) return true;

      const uriMatch = Boolean(
        item.login.uris?.some((u) => u.uri.toLowerCase().includes(this.query)),
      );
      if (uriMatch) return true;
    }

    return false;
  }
}

export class FolderMatchSpec extends CompositeSpecification<VaultItem> {
  constructor(private readonly targetFolderId: FolderId | string | null) {
    super();
  }

  isSatisfiedBy(item: VaultItem): boolean {
    if (this.targetFolderId === null) {
      return item.folderId == null;
    }
    return item.folderId === this.targetFolderId;
  }
}

export class FavoriteSpec extends CompositeSpecification<VaultItem> {
  isSatisfiedBy(item: VaultItem): boolean {
    return Boolean(item.favorite);
  }
}

export class ExcludeIdsSpec extends CompositeSpecification<VaultItem> {
  private readonly idSet: Set<string>;

  constructor(ids: Iterable<VaultItemId | string>) {
    super();
    this.idSet = new Set(ids);
  }

  isSatisfiedBy(item: VaultItem): boolean {
    return !this.idSet.has(item.id);
  }
}

/**
 * Filter items using composite specification
 */
export function filterVaultItemsBySpec(
  items: readonly VaultItem[],
  spec: ISpecification<VaultItem>,
): VaultItem[] {
  return items.filter((item) => spec.isSatisfiedBy(item));
}
