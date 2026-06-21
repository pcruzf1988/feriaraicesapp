import { describe, it, expect } from "vitest";
import { buildUserDoc } from "./user-doc.js";

const creado = new Date("2026-06-20T00:00:00Z");

describe("buildUserDoc", () => {
  it("builds the base usuarios/{uid} document shape (doc §8)", () => {
    const doc = buildUserDoc({
      email: "ana@example.com",
      nombre: "Ana Quispe",
      rol: "consumidor",
      creado,
    });
    expect(doc).toEqual({
      rol: "consumidor",
      nombre: "Ana Quispe",
      email: "ana@example.com",
      creado,
    });
  });

  it("throws on an invalid role instead of building a doc", () => {
    expect(() =>
      buildUserDoc({ email: "x@y.com", nombre: "X", rol: "admin", creado })
    ).toThrow(/rol/i);
  });

  it("falls back to the email local-part when nombre is missing", () => {
    const doc = buildUserDoc({ email: "pedro@example.com", rol: "productor", creado });
    expect(doc.nombre).toBe("pedro");
  });

  it("trims surrounding whitespace from nombre and email", () => {
    const doc = buildUserDoc({
      email: "  ana@example.com  ",
      nombre: "  Ana  ",
      rol: "consumidor",
      creado,
    });
    expect(doc.email).toBe("ana@example.com");
    expect(doc.nombre).toBe("Ana");
  });

  it("throws when email is missing", () => {
    expect(() => buildUserDoc({ nombre: "Ana", rol: "consumidor", creado })).toThrow(/email/i);
  });
});
