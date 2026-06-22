import { describe, it, expect } from "vitest";
import { validateAltaEsencial, buildProductorDoc } from "./alta.js";

const creado = new Date("2026-06-21T00:00:00Z");
const esencial = { nombre: "Huerta La Quebrada", provincia: "Jujuy", localidad: "Maimará", whatsapp: "+5493884000001" };

describe("validateAltaEsencial", () => {
  it("accepts the four essential fields", () => {
    expect(validateAltaEsencial(esencial)).toEqual({ valid: true, errors: {} });
  });
  it("requires nombre, provincia, localidad and whatsapp", () => {
    const r = validateAltaEsencial({});
    expect(r.valid).toBe(false);
    expect(r.errors.nombre).toBeTruthy();
    expect(r.errors.provincia).toBeTruthy();
    expect(r.errors.localidad).toBeTruthy();
    expect(r.errors.whatsapp).toBeTruthy();
  });
  it("rejects a whatsapp without digits", () => {
    expect(validateAltaEsencial({ ...esencial, whatsapp: "abc" }).valid).toBe(false);
  });
});

describe("buildProductorDoc", () => {
  it("builds a publishable minimal profile pending review (doc §8 / §8.1 rules)", () => {
    const doc = buildProductorDoc({ ...esencial, lat: -23.62, lng: -65.41, creado });
    expect(doc.estado).toBe("pendiente");
    expect(doc.plan).toBe("gratis");
    expect(doc.sellosVerificados).toEqual([]); // create rule requires size 0
    expect(doc.sellosDeclarados).toEqual([]);
    expect(doc.videos).toEqual([]);
    expect(doc.nombre).toBe("Huerta La Quebrada");
    expect(doc.whatsapp).toBe("+5493884000001");
    // pais defaults to Argentina (trinational future: BO/BR — doc §7.1)
    expect(doc.ubicacion).toEqual({ pais: "Argentina", provincia: "Jujuy", localidad: "Maimará", lat: -23.62, lng: -65.41 });
    expect(doc.cooperativa).toEqual({ pertenece: false });
    expect(doc.creado).toBe(creado);
  });

  it("carries an explicit pais when provided (Bolivia/Brasil a futuro)", () => {
    const doc = buildProductorDoc({ ...esencial, pais: "Bolivia", lat: 0, lng: 0, creado });
    expect(doc.ubicacion.pais).toBe("Bolivia");
  });

  it("carries optional descripcion, declared sellos and cooperativa when provided", () => {
    const doc = buildProductorDoc({
      ...esencial, lat: -23.62, lng: -65.41, creado,
      descripcion: "Verduras de quebrada",
      sellosDeclarados: ["spg", "familiar"],
      cooperativa: { pertenece: true, nombre: "Coop. X" },
    });
    expect(doc.descripcion).toBe("Verduras de quebrada");
    expect(doc.sellosDeclarados).toEqual(["spg", "familiar"]);
    expect(doc.cooperativa).toEqual({ pertenece: true, nombre: "Coop. X" });
  });

  it("never lets the caller preset estado, plan or sellosVerificados", () => {
    const doc = buildProductorDoc({
      ...esencial, lat: 0, lng: 0, creado,
      estado: "aprobado", plan: "premium", sellosVerificados: ["spg"],
    });
    expect(doc.estado).toBe("pendiente");
    expect(doc.plan).toBe("gratis");
    expect(doc.sellosVerificados).toEqual([]);
  });
});
