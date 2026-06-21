// Auth store singleton — wires real Firebase auth events into the pure session
// store. Import `session` anywhere to read or subscribe to the current session.
//
// This is the adapter seam: session-store.js stays pure/testable; this file binds
// it to Firebase via observeSession.

import { createSessionStore } from "./session-store.js";
import { observeSession, currentSession } from "./auth-service.js";

const store = createSessionStore();

// Start listening as soon as the module loads. Firebase fires the callback with
// the restored user (or null) shortly after init, flipping us out of LOADING.
observeSession((next) => store.setSession({ ...next, loading: false }));

// Re-reads the current user's profile and updates the store. Call after writing
// the usuarios doc (onboarding), where onAuthStateChanged would not fire.
async function refresh() {
  const next = await currentSession();
  store.setSession({ ...next, loading: false });
}

export const session = {
  get: store.getSession,
  subscribe: store.subscribe,
  refresh,
};
