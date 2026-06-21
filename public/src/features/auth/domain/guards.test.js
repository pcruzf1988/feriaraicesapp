import { describe, it, expect } from "vitest";
import { canAccess } from "./guards.js";

const anon = { authed: false, rol: null, isAdmin: false };
const consumidor = { authed: true, rol: "consumidor", isAdmin: false };
const productor = { authed: true, rol: "productor", isAdmin: false };
const admin = { authed: true, rol: "consumidor", isAdmin: true };

describe("canAccess", () => {
  it("allows public routes (no requirements) to anyone, even anonymous", () => {
    expect(canAccess({}, anon)).toBe(true);
    expect(canAccess({ requiresAuth: false }, anon)).toBe(true);
  });

  it("blocks auth-only routes for anonymous users", () => {
    expect(canAccess({ requiresAuth: true }, anon)).toBe(false);
    expect(canAccess({ requiresAuth: true }, consumidor)).toBe(true);
  });

  it("enforces role-restricted routes", () => {
    const route = { requiresAuth: true, roles: ["productor"] };
    expect(canAccess(route, productor)).toBe(true);
    expect(canAccess(route, consumidor)).toBe(false);
    expect(canAccess(route, anon)).toBe(false);
  });

  it("restricts admin routes to admins only (via custom claim, not rol)", () => {
    const route = { requiresAdmin: true };
    expect(canAccess(route, admin)).toBe(true);
    expect(canAccess(route, productor)).toBe(false);
    expect(canAccess(route, anon)).toBe(false);
  });
});
