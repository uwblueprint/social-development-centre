/** Someone on an admin people list (Admins, Members). */
export interface PersonRow {
  id: string;
  name: string | null;
  email: string;
  addedAt: string;
  hasSignedIn: boolean;
}

export function displayName(person: PersonRow): string {
  return person.name ?? person.email;
}
