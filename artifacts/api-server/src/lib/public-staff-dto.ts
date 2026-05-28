/** Public booking page — no staff PII (email, phone, userId). */
export function toPublicStaffDto(row: {
  id: string;
  displayName: string;
  bio?: string | null;
  photoUrl?: string | null;
  color?: string | null;
}) {
  return {
    id: row.id,
    displayName: row.displayName,
    bio: row.bio ?? null,
    photoUrl: row.photoUrl ?? null,
    color: row.color ?? null,
  };
}
