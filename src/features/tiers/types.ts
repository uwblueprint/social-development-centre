/** A tier admins offer, in the order they set. Prices are whole Canadian dollars. */
export interface Tier {
  id: string;
  name: string;
  priceCad: number;
  /** Members who have it, including members on it after it stops being offered. */
  memberCount: number;
}

/** What a member sees when choosing. */
export interface OfferedTier {
  id: string;
  name: string;
  priceCad: number;
}

export interface TierMember {
  personId: string;
  name: string | null;
  email: string;
}

export interface TierValues {
  name: string;
  priceCad: string;
}

/** "$50". Prices are always Canadian dollars; the pages say so once. */
export function formatPrice(priceCad: number): string {
  return `$${priceCad.toLocaleString("en-CA")}`;
}
