import { describe, it, expect } from "vitest";
import { filtrarProductos } from "./filtrar.js";

const productos = [
  { id: "1", nombrePrincipal: "Maíz criollo", otrosNombres: ["Capia"], categoriaId: "semillas", disponibilidad: "disponible" },
  { id: "2", nombrePrincipal: "Acelga", otrosNombres: ["Penca"], categoriaId: "verduras", disponibilidad: "poca" },
  { id: "3", nombrePrincipal: "Quinoa", otrosNombres: [], categoriaId: "semillas", disponibilidad: "sin_stock" },
];

describe("filtrarProductos", () => {
  it("returns everything with no filters", () => {
    expect(filtrarProductos(productos, {})).toHaveLength(3);
  });

  it("searches the main name, accent- and case-insensitive", () => {
    expect(filtrarProductos(productos, { q: "maiz" }).map((p) => p.id)).toEqual(["1"]);
    expect(filtrarProductos(productos, { q: "ACELGA" }).map((p) => p.id)).toEqual(["2"]);
  });

  it("searches the alternate names (otros nombres) too (§4.2)", () => {
    expect(filtrarProductos(productos, { q: "capia" }).map((p) => p.id)).toEqual(["1"]);
    expect(filtrarProductos(productos, { q: "penca" }).map((p) => p.id)).toEqual(["2"]);
  });

  it("filters by category", () => {
    expect(filtrarProductos(productos, { categoriaId: "semillas" }).map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("filters by availability", () => {
    expect(filtrarProductos(productos, { disponibilidad: "disponible" }).map((p) => p.id)).toEqual(["1"]);
  });

  it("combines filters (AND)", () => {
    expect(filtrarProductos(productos, { q: "a", categoriaId: "verduras" }).map((p) => p.id)).toEqual(["2"]);
  });
});
