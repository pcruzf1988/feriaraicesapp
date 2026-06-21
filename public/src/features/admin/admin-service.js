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
  orderBy,
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
