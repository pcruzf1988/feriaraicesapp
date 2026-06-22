// Admin master-data service — Firestore CRUD adapter for categorías, sellos and
// recetas. Writes are admin-only (enforced by security rules via the custom
// claim). Verified against the real project, not unit-tested.

import { db } from "../../core/firebase/firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

export async function listAll(coll, orderField) {
  const c = collection(db, coll);
  const snap = await getDocs(orderField ? query(c, orderBy(orderField)) : c);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function createDoc(coll, data) {
  return addDoc(collection(db, coll), data);
}

export function updateDocById(coll, id, data) {
  return updateDoc(doc(db, coll, id), data);
}

export function removeDoc(coll, id) {
  return deleteDoc(doc(db, coll, id));
}

// --- Bloque 6: producer approval + seal verification + metrics ---

// Producers, optionally filtered by estado ("pendiente"|"aprobado"|"rechazado").
// Admin read is allowed by the rules regardless of estado.
export async function listProductores(estado) {
  const c = collection(db, "productores");
  const snap = await getDocs(estado ? query(c, where("estado", "==", estado)) : c);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Approve/reject a producer AND propagate the result to its products' denormalized
// `productorAprobado` flag (doc §8) — otherwise approved producers' products never
// surface in the feria. Done in one atomic batch.
export async function setProductorEstado(uid, estado) {
  const aprobado = estado === "aprobado";
  const productos = await getDocs(query(collection(db, "productos"), where("productorId", "==", uid)));
  const batch = writeBatch(db);
  batch.update(doc(db, "productores", uid), { estado, actualizado: serverTimestamp() });
  productos.forEach((p) => batch.update(p.ref, { productorAprobado: aprobado }));
  return batch.commit();
}

// Admin sets which declared seals are verified (doc §8 sellosVerificados — only
// the admin can write this field).
export function setSellosVerificados(uid, sellosVerificados) {
  return updateDoc(doc(db, "productores", uid), { sellosVerificados, actualizado: serverTimestamp() });
}
