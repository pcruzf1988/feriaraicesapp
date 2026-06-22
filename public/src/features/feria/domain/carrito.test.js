import { describe, it, expect } from "vitest";
import { addAlPedido } from "./carrito.js";

// A product as it arrives from Firestore (productos/{id}, doc §8) — carries the
// denormalized producer fields so a cart line can be built without extra reads.
const tomate = {
  id: "p1",
  nombrePrincipal: "Tomate perita",
  precio: 1200,
  unidad: "kg",
  productorId: "prodA",
  productorNombre: "Finca La Oca",
  productorLocalidad: "Yavi",
};
const lechuga = {
  id: "p2",
  nombrePrincipal: "Lechuga morada",
  precio: 800,
  unidad: "atado",
  productorId: "prodA",
  productorNombre: "Finca La Oca",
  productorLocalidad: "Yavi",
};
const miel = {
  id: "p3",
  nombrePrincipal: "Miel de monte",
  precio: 3500,
  unidad: "frasco",
  productorId: "prodB",
  productorNombre: "Apiarios del Norte",
  productorLocalidad: "Orán",
};

describe("addAlPedido", () => {
  it("adds a product to an empty cart, creating one producer group with the line at quantity 1", () => {
    const next = addAlPedido([], tomate);
    expect(next).toEqual([
      {
        productorId: "prodA",
        productorNombre: "Finca La Oca",
        productorLocalidad: "Yavi",
        items: [{ productoId: "p1", nombre: "Tomate perita", precio: 1200, unidad: "kg", cantidad: 1 }],
      },
    ]);
  });

  it("increments the quantity when the same product is added again (no duplicate line)", () => {
    const next = addAlPedido(addAlPedido([], tomate), tomate);
    expect(next).toHaveLength(1);
    expect(next[0].items).toHaveLength(1);
    expect(next[0].items[0].cantidad).toBe(2);
  });

  it("keeps two lines in the same group for two products of the same producer", () => {
    const next = addAlPedido(addAlPedido([], tomate), lechuga);
    expect(next).toHaveLength(1);
    expect(next[0].items.map((i) => i.productoId)).toEqual(["p1", "p2"]);
  });

  it("opens a separate group per producer (one cart per producer, doc §5.2)", () => {
    const next = addAlPedido(addAlPedido([], tomate), miel);
    expect(next).toHaveLength(2);
    expect(next.map((c) => c.productorId)).toEqual(["prodA", "prodB"]);
  });

  it("adds a custom quantity when given", () => {
    const next = addAlPedido([], tomate, 3);
    expect(next[0].items[0].cantidad).toBe(3);
  });

  it("does not mutate the input cart", () => {
    const carts = addAlPedido([], tomate);
    const snapshot = JSON.parse(JSON.stringify(carts));
    addAlPedido(carts, tomate);
    expect(carts).toEqual(snapshot);
  });
});
