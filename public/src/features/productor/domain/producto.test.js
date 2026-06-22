import { describe, it, expect } from "vitest";
import { validateProducto, buildProducto } from "./producto.js";

const creado = new Date("2026-06-22T00:00:00Z");
const ok = { nombrePrincipal: "Maíz criollo", categoriaId: "semillas", precio: 1500, unidad: "kg" };

describe("validateProducto", () => {
  it("accepts a complete product", () => {
    expect(validateProducto(ok)).toEqual({ valid: true, errors: {} });
  });
  it("requires nombrePrincipal, categoriaId and unidad", () => {
    const r = validateProducto({ precio: 100 });
    expect(r.valid).toBe(false);
    expect(r.errors.nombrePrincipal).toBeTruthy();
    expect(r.errors.categoriaId).toBeTruthy();
    expect(r.errors.unidad).toBeTruthy();
  });
  it("requires a price greater than zero", () => {
    expect(validateProducto({ ...ok, precio: 0 }).valid).toBe(false);
    expect(validateProducto({ ...ok, precio: -5 }).errors.precio).toBeTruthy();
  });
});

describe("buildProducto", () => {
  it("assembles the base producto with defaults (doc §8)", () => {
    const p = buildProducto({ ...ok, productorId: "prod-yavi", creado });
    expect(p.productorId).toBe("prod-yavi");
    expect(p.nombrePrincipal).toBe("Maíz criollo");
    expect(p.otrosNombres).toEqual([]);
    expect(p.fotos).toEqual([]);
    expect(p.vistas).toBe(0);
    expect(p.disponibilidad).toBe("disponible");
    expect(p.creado).toBe(creado);
    expect(p.actualizado).toBe(creado);
  });
  it("coerces precio to a number and keeps provided arrays", () => {
    const p = buildProducto({ ...ok, precio: "1500", otrosNombres: ["Capia"], fotos: ["u"], disponibilidad: "poca", productorId: "x", creado });
    expect(p.precio).toBe(1500);
    expect(typeof p.precio).toBe("number");
    expect(p.otrosNombres).toEqual(["Capia"]);
    expect(p.fotos).toEqual(["u"]);
    expect(p.disponibilidad).toBe("poca");
  });
});
