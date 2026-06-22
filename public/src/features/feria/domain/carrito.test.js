import { describe, it, expect } from "vitest";
import {
  addAlPedido,
  cambiarCantidad,
  quitarItem,
  quitarCarrito,
  totalCarrito,
  mensajeWhatsApp,
  buildPedido,
} from "./carrito.js";

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

// A two-line, two-producer cart used by the editing/total/message tests.
const sample = addAlPedido(
  addAlPedido(addAlPedido([], tomate, 2), lechuga),
  miel
);

describe("cambiarCantidad", () => {
  it("adds the delta to a line's quantity", () => {
    const next = cambiarCantidad(sample, "prodA", "p1", +1);
    expect(next[0].items.find((i) => i.productoId === "p1").cantidad).toBe(3);
  });

  it("subtracts the delta", () => {
    const next = cambiarCantidad(sample, "prodA", "p1", -1);
    expect(next[0].items.find((i) => i.productoId === "p1").cantidad).toBe(1);
  });

  it("removes the line when the quantity drops to zero or below", () => {
    const next = cambiarCantidad(sample, "prodA", "p2", -1); // lechuga was at 1
    expect(next[0].items.map((i) => i.productoId)).toEqual(["p1"]);
  });

  it("removes the whole producer group when its last line is removed", () => {
    const next = cambiarCantidad(sample, "prodB", "p3", -1); // miel was the only line
    expect(next.map((c) => c.productorId)).toEqual(["prodA"]);
  });

  it("does not mutate the input", () => {
    const snapshot = JSON.parse(JSON.stringify(sample));
    cambiarCantidad(sample, "prodA", "p1", +5);
    expect(sample).toEqual(snapshot);
  });
});

describe("quitarItem", () => {
  it("removes a single line", () => {
    const next = quitarItem(sample, "prodA", "p1");
    expect(next[0].items.map((i) => i.productoId)).toEqual(["p2"]);
  });

  it("removes the group when its last line goes", () => {
    const next = quitarItem(sample, "prodB", "p3");
    expect(next.map((c) => c.productorId)).toEqual(["prodA"]);
  });
});

describe("quitarCarrito", () => {
  it("removes a whole producer group", () => {
    const next = quitarCarrito(sample, "prodA");
    expect(next.map((c) => c.productorId)).toEqual(["prodB"]);
  });
});

describe("totalCarrito", () => {
  it("sums price × quantity across the group's lines", () => {
    // prodA: tomate 1200×2 + lechuga 800×1 = 3200
    expect(totalCarrito(sample[0])).toBe(3200);
  });
});

describe("mensajeWhatsApp", () => {
  it("builds the pre-filled order message (doc §5.3)", () => {
    const msg = mensajeWhatsApp(sample[0], { consumidor: "Pedro", localidad: "Rosario" });
    expect(msg).toBe(
      "¡Hola Finca La Oca! 🌱 Te escribo desde Raíces.\n" +
        "Quiero hacerte este pedido:\n\n" +
        "• 2 × Tomate perita\n" +
        "• 1 × Lechuga morada\n\n" +
        "Total estimado: $3.200 (a confirmar con vos)\n" +
        "Mi nombre: Pedro\n" +
        "Localidad de entrega: Rosario\n\n" +
        "¿Tenés disponible? ¿Cómo coordinamos el envío?"
    );
  });
});

describe("buildPedido", () => {
  it("builds the Firestore pedido doc (doc §8) with estado 'enviado'", () => {
    expect(buildPedido(sample[1], "user123")).toEqual({
      consumidorId: "user123",
      productorId: "prodB",
      items: [{ productoId: "p3", nombre: "Miel de monte", precio: 3500, unidad: "frasco", cantidad: 1 }],
      estado: "enviado",
    });
  });
});
