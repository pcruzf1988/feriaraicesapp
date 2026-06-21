// Pure observable session store — no Firebase import, so it is unit-tested.
//
// Holds the current session and notifies subscribers on change. The auth-store
// singleton wires real Firebase auth events into setSession.

export const LOADING_SESSION = Object.freeze({
  loading: true,
  authed: false,
  rol: null,
  isAdmin: false,
  user: null,
  profile: null,
});

export function createSessionStore(initial = LOADING_SESSION) {
  let session = initial;
  const subscribers = new Set();

  function getSession() {
    return session;
  }

  function setSession(next) {
    session = next;
    for (const fn of subscribers) fn(session);
  }

  // Registers fn, calls it immediately with the current session, and returns an
  // unsubscribe function.
  function subscribe(fn) {
    subscribers.add(fn);
    fn(session);
    return () => subscribers.delete(fn);
  }

  return { getSession, setSession, subscribe };
}
