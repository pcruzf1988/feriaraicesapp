// Route access decisions — pure domain.
//
// Given a route's access requirements and the current session, decide whether the
// route may render. The router consumes this to redirect unauthorized visitors
// to the login screen.
//
// Route meta (all optional):
//   { requiresAuth?: boolean, roles?: string[], requiresAdmin?: boolean }
// Session:
//   { authed: boolean, rol: string | null, isAdmin: boolean }
//
// Admin status comes from the Firebase custom claim (session.isAdmin), never from
// `rol` (doc §8.1).

export function canAccess(routeMeta = {}, session) {
  const { requiresAuth = false, roles = null, requiresAdmin = false } = routeMeta;

  if (requiresAdmin) {
    return Boolean(session?.isAdmin);
  }

  if (roles) {
    return Boolean(session?.authed) && roles.includes(session?.rol);
  }

  if (requiresAuth) {
    return Boolean(session?.authed);
  }

  return true;
}
