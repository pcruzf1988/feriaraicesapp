import { describe, it, expect } from "vitest";
import { validateCategoria, validateSello, validateReceta } from "./validate.js";

describe("validateCategoria", () => {
  it("accepts a non-empty nombre", () => {
    expect(validateCategoria({ nombre: "Verduras" })).toEqual({ valid: true, errors: {} });
  });
  it("rejects an empty or whitespace nombre", () => {
    expect(validateCategoria({ nombre: "" }).valid).toBe(false);
    expect(validateCategoria({ nombre: "   " }).valid).toBe(false);
    expect(validateCategoria({ nombre: "  " }).errors.nombre).toMatch(/nombre/i);
  });
});

describe("validateSello", () => {
  it("accepts a non-empty nombre", () => {
    expect(validateSello({ nombre: "Agroecológico SPG" }).valid).toBe(true);
  });
  it("rejects a missing nombre", () => {
    expect(validateSello({}).valid).toBe(false);
    expect(validateSello({}).errors.nombre).toMatch(/nombre/i);
  });
});

describe("validateReceta", () => {
  it("accepts a non-empty titulo", () => {
    expect(validateReceta({ titulo: "Humita en chala" }).valid).toBe(true);
  });
  it("rejects a missing titulo", () => {
    expect(validateReceta({ titulo: "" }).valid).toBe(false);
    expect(validateReceta({ titulo: "" }).errors.titulo).toMatch(/título|titulo/i);
  });
});
