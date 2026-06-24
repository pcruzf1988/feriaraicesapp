import { describe, it, expect } from "vitest";
import { productosCompatiblesVisibles, pasosLimpios } from "./recetas.js";

describe("productosCompatiblesVisibles", () => {
  const receta = { productosCompatibles: ["a", "b", "c"] };

  it("devuelve solo los aprobados, en el orden de productosCompatibles", () => {
    const productos = [
      { id: "b", productorAprobado: true, nombrePrincipal: "B" },
      { id: "a", productorAprobado: true, nombrePrincipal: "A" },
    ];
    expect(productosCompatiblesVisibles(receta, productos).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("excluye no aprobados", () => {
    const productos = [
      { id: "a", productorAprobado: false },
      { id: "b", productorAprobado: true },
    ];
    expect(productosCompatiblesVisibles(receta, productos).map((p) => p.id)).toEqual(["b"]);
  });

  it("excluye los que no existen entre los traídos", () => {
    const productos = [{ id: "a", productorAprobado: true }];
    expect(productosCompatiblesVisibles(receta, productos).map((p) => p.id)).toEqual(["a"]);
  });

  it("array vacío si no hay compatibles o falta el campo", () => {
    expect(productosCompatiblesVisibles({ productosCompatibles: [] }, [])).toEqual([]);
    expect(productosCompatiblesVisibles({}, [])).toEqual([]);
  });
});

describe("pasosLimpios", () => {
  it("recorta y descarta líneas vacías", () => {
    expect(pasosLimpios(["  Rallá  ", "", "   ", "Rehogá"])).toEqual(["Rallá", "Rehogá"]);
  });

  it("[] si no hay instrucciones", () => {
    expect(pasosLimpios(undefined)).toEqual([]);
    expect(pasosLimpios([])).toEqual([]);
  });
});
