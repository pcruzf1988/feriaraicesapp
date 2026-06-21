// Auth service — the ADAPTER between Firebase Auth/Firestore and our app.
//
// All Firebase I/O for authentication lives here. Pure decisions (role validity,
// user-doc shape, navigation) are delegated to ./domain, which is unit-tested.
// This file is verified against the real project, not with unit tests.

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { auth, db } from "../../core/firebase/firebase.js";
import { buildUserDoc } from "./domain/user-doc.js";
import { isValidRole } from "./domain/role.js";

const googleProvider = new GoogleAuthProvider();

function userRef(uid) {
  return doc(db, "usuarios", uid);
}

// Creates usuarios/{uid} on first registration. Tolerant: if the doc is missing
// AND no valid role is known yet (e.g. a brand-new Google user who used the login
// button), it returns null instead of throwing — the onboarding flow will collect
// the role and call completeProfile().
async function ensureUserDoc(user, { rol, nombre } = {}) {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  if (!isValidRole(rol)) return null;

  const data = buildUserDoc({
    email: user.email,
    nombre: nombre ?? user.displayName,
    rol,
    creado: serverTimestamp(),
  });
  await setDoc(ref, data);
  return data;
}

export async function registerWithEmail({ email, password, nombre, rol }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (nombre) await updateProfile(cred.user, { displayName: nombre });
  await ensureUserDoc(cred.user, { rol, nombre });
  return cred.user;
}

export async function loginWithEmail({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// `rol` is only used when a Google account signs in for the FIRST time WITH a role
// already chosen (register flow). When it's absent, the user lands in onboarding.
export async function loginWithGoogle({ rol } = {}) {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user, { rol });
  return cred.user;
}

export function logout() {
  return signOut(auth);
}

// Creates the usuarios/{uid} doc for the CURRENT user once they pick a role in
// onboarding. Throws on an invalid role (the UI only passes valid ones).
export async function completeProfile({ rol, nombre } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");
  const data = buildUserDoc({
    email: user.email,
    nombre: nombre ?? user.displayName,
    rol,
    creado: serverTimestamp(),
  });
  await setDoc(userRef(user.uid), data);
  return data;
}

async function fetchProfile(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

// Normalizes a Firebase user into our session shape (profile + admin claim, §8.1).
async function buildSession(user) {
  if (!user) {
    return { authed: false, rol: null, isAdmin: false, user: null, profile: null };
  }
  const [profile, token] = await Promise.all([
    fetchProfile(user.uid),
    user.getIdTokenResult(),
  ]);
  return {
    authed: true,
    rol: profile?.rol ?? null,
    isAdmin: token.claims.admin === true,
    user,
    profile,
  };
}

// Subscribes to auth state, emitting a normalized session on every change.
export function observeSession(callback) {
  return onAuthStateChanged(auth, (user) => {
    buildSession(user).then(callback);
  });
}

// Rebuilds the session for the current user on demand (used after completeProfile,
// since writing Firestore does not re-fire onAuthStateChanged).
export function currentSession() {
  return buildSession(auth.currentUser);
}
