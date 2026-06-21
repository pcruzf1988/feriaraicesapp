import { describe, it, expect } from "vitest";
import { VALID_ROLES, isValidRole } from "./role.js";

describe("role domain", () => {
  it("accepts 'consumidor' and 'productor' as valid roles", () => {
    expect(isValidRole("consumidor")).toBe(true);
    expect(isValidRole("productor")).toBe(true);
  });

  it("rejects 'admin' as a stored role (admin is a custom claim, never a doc field)", () => {
    expect(isValidRole("admin")).toBe(false);
  });

  it("rejects unknown, empty, or non-string values", () => {
    expect(isValidRole("vendedor")).toBe(false);
    expect(isValidRole("")).toBe(false);
    expect(isValidRole(null)).toBe(false);
    expect(isValidRole(undefined)).toBe(false);
    expect(isValidRole(123)).toBe(false);
  });

  it("exposes exactly the two valid roles", () => {
    expect(VALID_ROLES).toEqual(["consumidor", "productor"]);
  });
});
