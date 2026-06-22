// Productos service — Firestore CRUD + Storage photo upload for a producer's own
// products. Each write carries the denormalized producer fields (doc §8) so the
// feria can list/sort without extra reads.

import { db, storage } from "../../core/firebase/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

import { buildProducto } from "./domain/producto.js";
import { denormalizeProducto } from "./domain/denormalize.js";

export async function listByProducer(uid) {
  const q = query(collection(db, "productos"), where("productorId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listCategorias() {
  const snap = await getDocs(collection(db, "categorias"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export function createProducto(productor, data) {
  const base = buildProducto({ ...data, productorId: productor.id, creado: serverTimestamp() });
  return addDoc(collection(db, "productos"), denormalizeProducto(base, productor));
}

// Updates editable fields + refreshes the denormalized producer snapshot, without
// touching vistas/creado.
export function updateProducto(id, productor, data) {
  const editable = {
    nombrePrincipal: String(data.nombrePrincipal).trim(),
    otrosNombres: data.otrosNombres ?? [],
    categoriaId: data.categoriaId,
    descripcion: data.descripcion ?? "",
    precio: Number(data.precio) || 0,
    unidad: data.unidad,
    disponibilidad: data.disponibilidad ?? "disponible",
    fotos: data.fotos ?? [],
    actualizado: serverTimestamp(),
  };
  return updateDoc(doc(db, "productos", id), denormalizeProducto(editable, productor));
}

export function deleteProducto(id) {
  return deleteDoc(doc(db, "productos", id));
}

// Uploads a photo under productos/{uid}/ and returns its download URL.
export async function uploadFoto(uid, file) {
  const safe = file.name.replace(/[^\w.\-]/g, "_");
  const r = ref(storage, `productos/${uid}/${Date.now()}_${safe}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
