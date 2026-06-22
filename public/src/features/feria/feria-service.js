// Feria service — reads the public marketplace data from Firestore.
// Products are public (read rule allows anyone); we only surface approved ones.

import { db } from "../../core/firebase/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

export async function listProductosAprobados() {
  const q = query(collection(db, "productos"), where("productorAprobado", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listCategorias() {
  const snap = await getDocs(query(collection(db, "categorias"), orderBy("orden")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
