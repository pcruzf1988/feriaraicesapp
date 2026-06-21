// Auth role domain rules.
//
// Only "consumidor" and "productor" are stored on the usuarios/{uid} document.
// "admin" is NEVER a stored role — it is granted via a Firebase Auth custom claim
// (token.admin == true), so a user can't escalate themselves by editing a field
// (doc §8.1).

export const VALID_ROLES = ["consumidor", "productor"];

export function isValidRole(rol) {
  return VALID_ROLES.includes(rol);
}
