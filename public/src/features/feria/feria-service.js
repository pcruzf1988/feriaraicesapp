// Feria service — reads the public marketplace data from Firestore.
// Products are public (read rule allows anyone); we only surface approved ones.

import { db } from "../../core/firebase/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  updateDoc,
  increment,
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

// --- Product detail (ficha) + public producer profile (doc §4.5) ---

export async function getProducto(id) {
  const snap = await getDoc(doc(db, "productos", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Public producer profile. Firestore rules only return it when estado == 'aprobado'
// (or to the owner/admin), so an anonymous visitor sees approved producers only.
export async function getProductor(uid) {
  const snap = await getDoc(doc(db, "productores", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// A producer's published products. Queried by productorId then filtered to approved
// ones in memory to avoid needing a composite index.
export async function listProductosDeProductor(uid) {
  const q = query(collection(db, "productos"), where("productorId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.productorAprobado === true);
}

// Recipes linked to a product. The product↔recipe link lives ONLY in recetas
// (doc §8: single source of truth) via productosCompatibles array-contains.
export async function listRecetasDeProducto(productoId) {
  const q = query(
    collection(db, "recetas"),
    where("productosCompatibles", "array-contains", productoId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listSellos() {
  const snap = await getDocs(collection(db, "sellos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- Recetas públicas (doc §4.5). Lectura pública por reglas. ---

export async function listRecetas() {
  const snap = await getDocs(collection(db, "recetas"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getReceta(id) {
  const snap = await getDoc(doc(db, "recetas", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Best-effort view counter (doc §10 "productos más vistos"). The security rules
// only allow the +1 increment for signed-in users, so this silently no-ops for
// anonymous visitors.
export async function contarVista(id) {
  try {
    await updateDoc(doc(db, "productos", id), { vistas: increment(1) });
  } catch {
    /* anonymous visitor or offline — metrics are non-critical */
  }
}
