import { describe, it, expect } from "vitest";
import { decideNavigation, needsOnboarding } from "./navigation.js";

const loading = { loading: true, authed: false, rol: null, isAdmin: false };
const anon = { loading: false, authed: false, rol: null, isAdmin: false };
const consumidor = { loading: false, authed: true, rol: "consumidor", isAdmin: false };
const productor = { loading: false, authed: true, rol: "productor", isAdmin: false };
const roleless = { loading: false, authed: true, rol: null, isAdmin: false };
const admin = { loading: false, authed: true, rol: null, isAdmin: true };

describe("decideNavigation", () => {
  it("renders public routes regardless of session (even while loading)", () => {
    expect(decideNavigation({ meta: {}, session: loading })).toEqual({ action: "render" });
    expect(decideNavigation({ meta: {}, session: anon })).toEqual({ action: "render" });
  });

  it("waits while the session is still loading on a protected route", () => {
    expect(decideNavigation({ meta: { requiresAuth: true }, session: loading })).toEqual({ action: "wait" });
  });

  it("redirects to /ingreso when a resolved session lacks access", () => {
    expect(decideNavigation({ meta: { requiresAuth: true }, session: anon })).toEqual({ action: "redirect", to: "/ingreso" });
  });

  it("redirects when the role does not match", () => {
    expect(
      decideNavigation({ meta: { requiresAuth: true, roles: ["productor"] }, session: consumidor })
    ).toEqual({ action: "redirect", to: "/ingreso" });
  });

  it("renders when a resolved session has access", () => {
    expect(
      decideNavigation({ meta: { requiresAuth: true, roles: ["productor"] }, session: productor })
    ).toEqual({ action: "render" });
  });

  it("honors a custom login path", () => {
    expect(decideNavigation({ meta: { requiresAuth: true }, session: anon, loginPath: "/entrar" })).toEqual({ action: "redirect", to: "/entrar" });
  });
});

describe("onboarding (authed but no role yet)", () => {
  it("forces an authed, role-less user to onboarding from any normal route", () => {
    expect(decideNavigation({ meta: {}, session: roleless })).toEqual({ action: "redirect", to: "/onboarding" });
    expect(decideNavigation({ meta: { requiresAuth: true }, session: roleless })).toEqual({ action: "redirect", to: "/onboarding" });
  });

  it("renders the onboarding route for a role-less authed user", () => {
    expect(decideNavigation({ meta: { onboarding: true }, session: roleless })).toEqual({ action: "render" });
  });

  it("sends a user who already has a role away from onboarding", () => {
    expect(decideNavigation({ meta: { onboarding: true }, session: consumidor })).toEqual({ action: "redirect", to: "/feria" });
  });

  it("sends an anonymous visitor from onboarding to login", () => {
    expect(decideNavigation({ meta: { onboarding: true }, session: anon })).toEqual({ action: "redirect", to: "/ingreso" });
  });

  it("does NOT force onboarding on admins (no stored rol, but isAdmin)", () => {
    expect(decideNavigation({ meta: {}, session: admin })).toEqual({ action: "render" });
  });

  it("does not act on onboarding while the session is still loading", () => {
    expect(decideNavigation({ meta: {}, session: loading })).toEqual({ action: "render" });
  });

  it("needsOnboarding is true only for authed, non-admin, role-less, resolved sessions", () => {
    expect(needsOnboarding(roleless)).toBe(true);
    expect(needsOnboarding(consumidor)).toBe(false);
    expect(needsOnboarding(admin)).toBe(false);
    expect(needsOnboarding(anon)).toBe(false);
    expect(needsOnboarding(loading)).toBe(false);
  });
});
