// Producer service — Firestore adapter for the productores/{uid} profile and the
// sellos list shown during alta. Verified against the real project.

import { db, storage } from "../../core/firebase/firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

import { buildProductorDoc } from "./domain/alta.js";

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "productores", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listSellos() {
  const snap = await getDocs(collection(db, "sellos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Creates the productores/{uid} profile from wizard data (estado: pendiente).
export function createProfile(uid, data) {
  const docData = buildProductorDoc({ ...data, creado: serverTimestamp() });
  return setDoc(doc(db, "productores", uid), docData);
}

// Producer self-updates (cannot touch estado/plan/sellosVerificados — rules block it).
export function updateProfile(uid, patch) {
  return updateDoc(doc(db, "productores", uid), { ...patch, actualizado: serverTimestamp() });
}

// Uploads a cover image under productores/{uid}/ and returns its download URL.
export async function uploadPortada(uid, file) {
  const safe = file.name.replace(/[^\w.\-]/g, "_");
  const r = ref(storage, `productores/${uid}/${Date.now()}_${safe}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
