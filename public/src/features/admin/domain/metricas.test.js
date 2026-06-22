import { describe, it, expect } from "vitest";
import {
  productosMasVistos,
  productosMasPedidos,
  origenConsumidores,
  demografia,
  resumenProductores,
} from "./metricas.js";

describe("productosMasVistos", () => {
  const productos = [
    { id: "a", nombrePrincipal: "Acelga", vistas: 10 },
    { id: "b", nombrePrincipal: "Bananas", vistas: 3 },
    { id: "c", nombrePrincipal: "Cayote" }, // no views
    { id: "d", nombrePrincipal: "Dulce", vistas: 25 },
  ];

  it("ranks products by views descending, excluding those never viewed", () => {
    expect(productosMasVistos(productos).map((p) => p.id)).toEqual(["d", "a", "b"]);
  });

  it("limits to the top N", () => {
    expect(productosMasVistos(productos, 2).map((p) => p.id)).toEqual(["d", "a"]);
  });
});

describe("productosMasPedidos", () => {
  const pedidos = [
    { items: [{ productoId: "a", nombre: "Acelga", cantidad: 2 }, { productoId: "b", nombre: "Bananas", cantidad: 1 }] },
    { items: [{ productoId: "a", nombre: "Acelga", cantidad: 3 }] },
  ];

  it("counts order intents and units per product, ranked by intents", () => {
    expect(productosMasPedidos(pedidos)).toEqual([
      { productoId: "a", nombre: "Acelga", pedidos: 2, unidades: 5 },
      { productoId: "b", nombre: "Bananas", pedidos: 1, unidades: 1 },
    ]);
  });
});

describe("origenConsumidores", () => {
  const usuarios = [
    { rol: "consumidor", localidadReferencia: { provincia: "Santa Fe", localidad: "Rosario" } },
    { rol: "consumidor", localidadReferencia: { provincia: "Santa Fe", localidad: "Santa Fe" } },
    { rol: "consumidor", localidadOrigen: { provincia: "Buenos Aires" } },
    { rol: "productor", ubicacion: { provincia: "Jujuy" } }, // not a consumer
    { rol: "consumidor" }, // no declared locality
  ];

  it("aggregates consumers by province, ranked by count", () => {
    expect(origenConsumidores(usuarios)).toEqual([
      { provincia: "Santa Fe", total: 2 },
      { provincia: "Buenos Aires", total: 1 },
    ]);
  });
});

describe("demografia", () => {
  it("aggregates declared age range and gender, ignoring blanks", () => {
    const usuarios = [
      { rangoEtario: "25-34", genero: "F" },
      { rangoEtario: "25-34", genero: "M" },
      { genero: "F" },
      {},
    ];
    expect(demografia(usuarios)).toEqual({
      rangoEtario: { "25-34": 2 },
      genero: { F: 2, M: 1 },
    });
  });
});

describe("resumenProductores", () => {
  it("counts producers by estado", () => {
    const productores = [
      { estado: "aprobado" },
      { estado: "aprobado" },
      { estado: "pendiente" },
      { estado: "rechazado" },
      {},
    ];
    expect(resumenProductores(productores)).toEqual({ aprobado: 2, pendiente: 1, rechazado: 1 });
  });
});
