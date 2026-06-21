// Builds the base usuarios/{uid} document (doc §8) from registration data.
//
// Pure domain: the `creado` timestamp is injected by the caller (the auth-service
// adapter passes serverTimestamp()), so this stays free of any Firebase import
// and fully unit-testable.
//
// Consumer-only fields (localidadOrigen, localidadReferencia, rangoEtario, genero)
// are NOT set at registration — they are filled later from "Mi cuenta".

import { isValidRole } from "./role.js";

export function buildUserDoc({ email, nombre, rol, creado }) {
  if (!isValidRole(rol)) {
    throw new RangeError(`rol inválido: ${rol}`);
  }

  const cleanEmail = String(email ?? "").trim();
  if (!cleanEmail) {
    throw new Error("email es obligatorio");
  }

  const cleanNombre = String(nombre ?? "").trim() || cleanEmail.split("@")[0];

  return {
    rol,
    nombre: cleanNombre,
    email: cleanEmail,
    creado,
  };
}
