// Pure navigation policy: given a route's access meta and the current session,
// decide what the router should do. Keeps the router (DOM/hash I/O) free of any
// access reasoning, which lives here and in guards.js — both unit-tested.

import { canAccess } from "./guards.js";

function isProtected(meta = {}) {
  return Boolean(meta.requiresAuth || meta.roles || meta.requiresAdmin);
}

// A user who authenticated (e.g. via Google) but has no stored role yet — they
// have no usuarios/{uid} doc. Admins are exempt (they have a custom claim, not a
// rol). Only meaningful once the session has resolved.
export function needsOnboarding(session) {
  return Boolean(
    session &&
      !session.loading &&
      session.authed &&
      !session.isAdmin &&
      !session.rol
  );
}

// Returns one of:
//   { action: "render" }              → show the route's view
//   { action: "wait" }                → session not resolved yet; hold
//   { action: "redirect", to: path }  → session resolved without access / needs role
export function decideNavigation({
  meta = {},
  session,
  loginPath = "/ingreso",
  onboardingPath = "/onboarding",
  homePath = "/feria",
}) {
  // The onboarding route itself: only a role-less authed user belongs here.
  if (meta.onboarding) {
    if (!session?.authed) return { action: "redirect", to: loginPath };
    if (!needsOnboarding(session)) return { action: "redirect", to: homePath };
    return { action: "render" };
  }

  // Any other route: an authed user without a role must finish onboarding first.
  if (needsOnboarding(session)) {
    return { action: "redirect", to: onboardingPath };
  }

  if (!isProtected(meta)) {
    return { action: "render" };
  }
  if (session?.loading) {
    return { action: "wait" };
  }
  if (!canAccess(meta, session)) {
    return { action: "redirect", to: loginPath };
  }
  return { action: "render" };
}
