import { describe, it, expect } from "vitest";
import { denormalizeProducto } from "./denormalize.js";

const productor = {
  nombre: "Flia. Quispe",
  estado: "aprobado",
  ubicacion: { provincia: "Jujuy", localidad: "Yavi", lat: -22.12, lng: -65.46 },
};

describe("denormalizeProducto", () => {
  it("copies the producer fields needed to list/sort products (doc §8)", () => {
    const p = denormalizeProducto({ nombrePrincipal: "Maíz criollo", precio: 1200 }, productor);
    expect(p.productorNombre).toBe("Flia. Quispe");
    expect(p.productorLocalidad).toBe("Yavi");
    expect(p.productorLat).toBe(-22.12);
    expect(p.productorLng).toBe(-65.46);
    expect(p.productorAprobado).toBe(true);
  });

  it("preserves the original product fields", () => {
    const p = denormalizeProducto({ nombrePrincipal: "Maíz criollo", precio: 1200 }, productor);
    expect(p.nombrePrincipal).toBe("Maíz criollo");
    expect(p.precio).toBe(1200);
  });

  it("sets productorAprobado=false when the producer is not approved", () => {
    const p = denormalizeProducto({}, { ...productor, estado: "pendiente" });
    expect(p.productorAprobado).toBe(false);
  });

  it("does not mutate the original product object", () => {
    const original = { nombrePrincipal: "Quinoa" };
    denormalizeProducto(original, productor);
    expect(original).toEqual({ nombrePrincipal: "Quinoa" });
  });
});
